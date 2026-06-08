

package org.springframework.samples.petclinic.system;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatExceptionOfType;




class CrashControllerTests {

	final CrashController testee = new CrashController();

	@Test
	void triggerException() {
		assertThatExceptionOfType(RuntimeException.class).isThrownBy(() -> testee.triggerException())
			.withMessageContaining("Expected: controller used to showcase what happens when an exception is thrown");
	}

}
