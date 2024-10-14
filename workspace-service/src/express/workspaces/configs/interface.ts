export interface IConfigs {
    _id: string;
    workspaceId: string;
    name: string;
    value:  string | boolean | number;
    type: 'string' | 'boolean' | 'number';
    isAlive: boolean;
  }
  