import { Platform } from 'react-native';
import structuredClone from '@ungap/structured-clone';

/**
 * AI SDK streaming needs structuredClone + TextEncoder/DecoderStream on native.
 * @see https://ai-sdk.dev/docs/getting-started/expo
 */
if (Platform.OS !== 'web') {
  void (async () => {
    // RN deep import — not in public typings.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions') as {
      polyfillGlobal: (name: string, getValue: () => unknown) => void;
    };
    const { TextEncoderStream, TextDecoderStream } =
      await import('@stardazed/streams-text-encoding');

    if (!('structuredClone' in globalThis)) {
      polyfillGlobal('structuredClone', () => structuredClone);
    }

    polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
    polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
  })();
}

export {};
