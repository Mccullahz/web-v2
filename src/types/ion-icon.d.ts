declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      name?: string;
      src?: string;
      icon?: string;
      mode?: 'ios' | 'md';
      color?: string;
      size?: string;
      slot?: string;
    };
  }
}

