import { computed, ref } from 'vue-lynx';

import { uid } from '../lib/uid';
import type { FileUIPart } from '../types/ai';
import { useOverlay } from './useOverlay';
import { useSession } from './useSession';
import { useToast } from './useToast';

export interface FileWithStatus {
  id: string;
  name: string;
  mediaType: string;
  url: string;
  status: 'uploading' | 'uploaded' | 'error';
}

/**
 * Replaces useFileUploadWithStatus (PRD F8): Lynx has no file picker or
 * drag-and-drop, so the paperclip opens a picker of server-bundled sample
 * images. A short fake "uploading" phase keeps the chip status UI
 * (spinner -> ready) exercised like the original's real uploads.
 */
export function useAttachments() {
  const overlay = useOverlay();
  const toast = useToast();
  const { loggedIn } = useSession();

  const files = ref<FileWithStatus[]>([]);

  async function open() {
    if (!loggedIn.value) {
      toast.add({
        description: 'You need to be logged in to attach files',
        icon: 'i-lucide-alert-circle',
      });
      return;
    }
    const instance = overlay.open<{ name: string; url: string; mediaType: string } | false>(
      'sample-picker',
    );
    const sample = await instance.result;
    if (!sample) return;

    const id = uid();
    files.value.push({
      id,
      name: sample.name,
      mediaType: sample.mediaType,
      url: sample.url,
      status: 'uploading',
    });
    setTimeout(() => {
      const file = files.value.find((f) => f.id === id);
      if (file) file.status = 'uploaded';
    }, 600);
  }

  function removeFile(id: string) {
    files.value = files.value.filter((f) => f.id !== id);
  }

  function clearFiles() {
    files.value = [];
  }

  const uploading = computed(() => files.value.some((f) => f.status === 'uploading'));

  const uploadedFiles = computed<FileUIPart[]>(() =>
    files.value
      .filter((f) => f.status === 'uploaded')
      .map((f) => ({ type: 'file' as const, mediaType: f.mediaType, url: f.url })),
  );

  return { files, open, removeFile, clearFiles, uploading, uploadedFiles };
}
