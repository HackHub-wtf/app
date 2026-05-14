package wtf.hackhub.application.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UploadFileUseCaseTest {

	@Mock
	StoragePort storagePort;
	@InjectMocks
	UploadFileUseCase useCase;

	@Test
	void uploads_valid_jpeg_and_returns_url() {
		// JPEG magic bytes: FF D8 FF
		byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49,
				0x46, 0x00};
		MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpegBytes);

		when(storagePort.upload(any(), any(), any(), anyLong(), any())).thenReturn("key");
		when(storagePort.presignedDownloadUrl(any(), any(), anyInt())).thenReturn("https://minio/url");

		UploadFileUseCase.Result result = useCase.execute(file, "hackhub-avatars", "avatars");

		assertThat(result.url()).isEqualTo("https://minio/url");
		verify(storagePort).upload(eq("hackhub-avatars"), contains("avatars/"), any(), anyLong(), eq("image/jpeg"));
	}

	@Test
	void rejects_file_exceeding_size_limit() {
		// Create a file reported as 51MB — Tika won't even be called
		byte[] tiny = new byte[]{1, 2, 3};
		MockMultipartFile file = new MockMultipartFile("file", "big.bin", "application/octet-stream", tiny) {
			@Override
			public long getSize() {
				return StoragePort.MAX_FILE_SIZE_BYTES + 1;
			}
		};

		assertThatThrownBy(() -> useCase.execute(file, "bucket", "prefix"))
				.isInstanceOf(StoragePort.FileTooLargeException.class);
		verify(storagePort, never()).upload(any(), any(), any(), anyLong(), any());
	}

	@Test
	void rejects_executable_binary() {
		// ELF magic bytes
		byte[] elfBytes = new byte[]{0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00};
		MockMultipartFile file = new MockMultipartFile("file", "hack.elf", "application/octet-stream", elfBytes);

		assertThatThrownBy(() -> useCase.execute(file, "bucket", "prefix"))
				.isInstanceOf(StoragePort.UnsupportedFileTypeException.class);
		verify(storagePort, never()).upload(any(), any(), any(), anyLong(), any());
	}

	@Test
	void handles_null_filename() throws Exception {
		byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49,
				0x46, 0x00};
		// null originalFilename → extractExtension returns ""
		MockMultipartFile file = new MockMultipartFile("file", null, "image/jpeg", jpegBytes);
		when(storagePort.upload(any(), any(), any(), anyLong(), any())).thenReturn("key");
		when(storagePort.presignedDownloadUrl(any(), any(), anyInt())).thenReturn("https://url");

		UploadFileUseCase.Result result = useCase.execute(file, "bucket", "prefix");
		assertThat(result.url()).isEqualTo("https://url");
	}

	@Test
	void throws_file_read_exception_when_get_input_stream_fails() {
		// A multipart file whose getInputStream() throws IOException — hits the first
		// catch block
		MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[0]) {
			@Override
			public java.io.InputStream getInputStream() throws java.io.IOException {
				throw new java.io.IOException("stream broken");
			}
		};

		assertThatThrownBy(() -> useCase.execute(file, "bucket", "prefix"))
				.isInstanceOf(UploadFileUseCase.FileReadException.class);
		verify(storagePort, never()).upload(any(), any(), any(), anyLong(), any());
	}
}
