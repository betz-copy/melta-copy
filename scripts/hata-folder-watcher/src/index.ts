import FolderWatcher from './script';

function main() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    FolderWatcher.watch();
}

main();
