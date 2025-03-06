
declare module '@editorjs/editorjs' {
  export interface OutputData {
    time: number;
    blocks: OutputBlockData[];
    version: string;
  }

  export interface OutputBlockData {
    id?: string;
    type: string;
    data: {
      [key: string]: any;
    };
  }

  export interface EditorConfig {
    holder: string | HTMLElement;
    tools?: {
      [key: string]: any;
    };
    data?: {
      blocks: OutputBlockData[];
    };
    placeholder?: string;
    onChange?: (api: API, event: CustomEvent) => void;
    onReady?: () => void;
  }

  export interface API {
    blocks: {
      render: (data: OutputData) => Promise<void>;
      renderFromHTML: (data: string) => Promise<void>;
    };
    saver: {
      save: () => Promise<OutputData>;
    };
  }

  export default class EditorJS {
    constructor(config: EditorConfig);
    render(data: { blocks: OutputBlockData[] }): Promise<void>;
    save(): Promise<OutputData>;
    destroy(): void;
  }
}

declare module '@editorjs/header';
declare module '@editorjs/list';
declare module '@editorjs/paragraph';
declare module '@editorjs/quote';
declare module '@editorjs/code';
declare module '@editorjs/link';
declare module '@editorjs/marker';
declare module 'editorjs-parser';
