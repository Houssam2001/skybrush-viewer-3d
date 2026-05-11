// Make .mp3 imports work nicely with Typescript
declare module '*.mp3' {
  const value: string;
  export default value;
}

// Make PNG imports work nicely with Typescript
declare module '*.png' {
  const value: string;
  export default value;
}

// Make .obj imports work nicely with Typescript
declare module '*.obj' {
  const value: string;
  export default value;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
      'a-camera': any;
      'a-sky': any;
      'a-plane': any;
      'a-light': any;
      'a-assets': any;
      'a-asset-item': any;
    }
  }
}
