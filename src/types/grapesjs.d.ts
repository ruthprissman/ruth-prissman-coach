declare module 'grapesjs' {
  export interface EditorConfig {
    container: string | HTMLElement;
    height?: string;
    width?: string;
    fromElement?: boolean;
    storageManager?: any;
    assetManager?: any;
    styleManager?: any;
    blockManager?: any;
    panels?: any;
    deviceManager?: any;
    canvas?: any;
    plugins?: Array<string | ((editor: any) => void)>;
    pluginsOpts?: Record<string, any>;
  }

  export interface Editor {
    getHtml: () => string;
    getCss: () => string;
    setComponents: (components: string) => void;
    setStyle: (style: string) => void;
    destroy: () => void;
    getWrapper: () => any;
    Modal: any;
    Panels: any;
    BlockManager: any;
    StyleManager: any;
    Canvas: any;
    Commands: any;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
  }

  function init(config: EditorConfig): Editor;
  export default { init };
}

declare module 'grapesjs-preset-newsletter' {
  const plugin: (editor: any, options?: any) => void;
  export default plugin;
}
