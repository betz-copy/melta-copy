## Entity Template Manager

### Setup:

1. Install recommended VS Code extentions:

    - eslint "dbaeumer.vscode-eslint"
    - prettier "esbenp.prettier-vscode"

2. Install node dependencies ("npm install")
3. run `npm run dev`

### Routes:

-   `/api/categories`
-   `/api/entities/templates`

### Interfaces

```
IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: object;
    disabled: boolean;
}
```

```
ICategory {
    name: string;
    displayName: string;
}
```
