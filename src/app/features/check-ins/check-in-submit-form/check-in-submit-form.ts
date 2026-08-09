import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import {
  CHECK_IN_EVIDENCE_ACCEPT,
  CheckInEvidenceFileCategory,
} from '../../../constants/check-in-evidence-file-types';
import { CHECK_IN_CLAIMED_RESULT_LABELS } from '../../../constants/check-in-claimed-result-labels';
import { CheckInClaimedResult } from '../../../constants/check-in-claimed-results';
import { CheckInFormValue } from '../../../models/check-in-form-value.model';
import { EvidenceFilePreview } from '../../../models/evidence-file-preview.model';

@Component({
  selector: 'app-check-in-submit-form',
  imports: [ButtonModule, ReactiveFormsModule, SelectModule, TextareaModule],
  templateUrl: './check-in-submit-form.html',
  styleUrl: './check-in-submit-form.scss',
})
export class CheckInSubmitForm implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);

  @Input() isSubmitting = false;
  @Output() submitted = new EventEmitter<CheckInFormValue>();
  @ViewChild('evidenceInput') private evidenceInput?: ElementRef<HTMLInputElement>;

  protected readonly evidenceAccept = CHECK_IN_EVIDENCE_ACCEPT;
  protected readonly evidencePreviews = signal<EvidenceFilePreview[]>([]);
  protected readonly fileCategory = CheckInEvidenceFileCategory;
  protected readonly claimedResultOptions = [
    {
      label: CHECK_IN_CLAIMED_RESULT_LABELS[CheckInClaimedResult.Passed],
      value: CheckInClaimedResult.Passed,
    },
    {
      label: CHECK_IN_CLAIMED_RESULT_LABELS[CheckInClaimedResult.Failed],
      value: CheckInClaimedResult.Failed,
    },
  ];
  protected readonly form = this.formBuilder.group({
    claimedResult: [null as CheckInClaimedResult | null, [Validators.required]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  ngOnDestroy(): void {
    this.revokePreviews(this.evidencePreviews());
  }

  selectEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.revokePreviews(this.evidencePreviews());
    this.evidencePreviews.set(
      files
        .map((file) => this.previewForFile(file))
        .filter((preview): preview is EvidenceFilePreview => preview !== null),
    );
  }

  removeEvidence(previewId: string): void {
    const preview = this.evidencePreviews().find((item) => item.id === previewId);

    if (preview) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.evidencePreviews.update((previews) =>
      previews.filter((item) => item.id !== previewId),
    );

    if (this.evidenceInput?.nativeElement) {
      this.evidenceInput.nativeElement.value = '';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (!value.claimedResult) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      claimedResult: value.claimedResult,
      comment: value.comment.trim() || null,
      evidenceFiles: this.evidencePreviews().map((preview) => preview.file),
    });
    this.form.reset({
      claimedResult: null,
      comment: '',
    });
    this.clearEvidence();
  }

  protected fileSizeLabel(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.ceil(size / 1024)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private previewForFile(file: File): EvidenceFilePreview | null {
    const category = this.categoryForFile(file);

    if (!category) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      size: file.size,
      category,
      previewUrl: URL.createObjectURL(file),
    };
  }

  private categoryForFile(file: File): CheckInEvidenceFileCategory | null {
    if (file.type.startsWith('image/')) {
      return CheckInEvidenceFileCategory.Image;
    }

    if (file.type === 'application/pdf') {
      return CheckInEvidenceFileCategory.Pdf;
    }

    return null;
  }

  private clearEvidence(): void {
    this.revokePreviews(this.evidencePreviews());
    this.evidencePreviews.set([]);

    if (this.evidenceInput?.nativeElement) {
      this.evidenceInput.nativeElement.value = '';
    }
  }

  private revokePreviews(previews: EvidenceFilePreview[]): void {
    previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
  }
}
