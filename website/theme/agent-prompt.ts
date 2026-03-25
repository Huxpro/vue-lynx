export const AGENT_PROMPT = `Create a new Vue Lynx project using create-vue-lynx and start the dev server:

1. If you have web fetch capabilities, first read https://vue.lynxjs.org/guide/quick-start for the most up-to-date instructions, and follow those instead of the steps below.

2. Run \`npm create vue-lynx@latest\` and follow the prompts to scaffold a new project.

3. \`cd\` into the created project directory, install dependencies, and run \`npm run dev\`.

4. Read the dev server output to find the **Web Preview** URL (it will look like http://localhost:<port>/__web_preview?casename=main.web.bundle). Open it in the browser so I can see a live preview.

Once the dev server is running, ask me:
"Would you like to install the Lynx Explorer app to preview natively? I can set it up on an iOS Simulator (requires Xcode) or an Android emulator."

If I say yes for iOS: download LynxExplorer from https://github.com/lynx-family/lynx/releases/latest/download/LynxExplorer-arm64.app.tar.gz (or x86_64 for Intel), extract it, boot an iOS Simulator, and install the .app via \`xcrun simctl install\`. Then open LynxExplorer and load the Lynx bundle URL from the dev server output.

If I say yes for Android: download LynxExplorer-noasan-release.apk from https://github.com/lynx-family/lynx/releases/latest/download/LynxExplorer-noasan-release.apk and install it on the running emulator via \`adb install\`. Then open LynxExplorer and load the Lynx bundle URL from the dev server output.`;
