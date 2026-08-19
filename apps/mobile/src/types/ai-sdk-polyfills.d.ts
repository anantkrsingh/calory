declare module '@ungap/structured-clone' {
  export default function structuredClone<T>(value: T): T;
}

declare module '@stardazed/streams-text-encoding' {
  export class TextEncoderStream extends TransformStream<string, Uint8Array> {}
  export class TextDecoderStream extends TransformStream<Uint8Array, string> {}
}
