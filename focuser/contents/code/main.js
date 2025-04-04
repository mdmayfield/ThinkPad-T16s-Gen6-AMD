const APP_LIST = [
    'org.kde.konsole',
    'org.mozilla.firefox',
    'firefox',
    'thunderbird',
    'thunderbird-esr',
    'org.kde.kate'
];


function main() {
    console.info('[focuser] INSTALLING');

    // Existing windows
    workspace.windowList().forEach(configure);

    // New windows
    workspace.windowAdded.connect(configure);

    console.info('[focuser] INSTALLED');
}

function configure(window) {
    if (!isAllowed(window)) {
        console.info('[focuser] SKIP DISALLOWED', window.resourceClass);
        console.info('[focuser] resourceName is', window.resourceName);
        return;
    }

    console.info('[focuser] CONFIGURE', window.resourceClass);
    window.demandsAttentionChanged.connect(() => grantAttention(window));
}

function grantAttention(window) {
    console.info('[focuser] GRANT', window.resourceClass);
    workspace.activeWindow = window;
}

function isAllowed(window) {
    return APP_LIST.includes(window.resourceClass);
}


main();
