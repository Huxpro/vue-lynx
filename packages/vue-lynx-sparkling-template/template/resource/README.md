Shared app resources

This directory holds cross-platform assets used by Sparkling templates:
- app_icon.png — App icon for Android/iOS
- splash_icon.png — Splash image (light)
- splash_icon_dark.png — Splash image (dark)

Configure these via `app.config.ts`:
```
export default {
  appIcon: './resource/app_icon.png',
  plugin: [
    ['splash-screen', {
      backgroundColor: '#232323',
      image: './resource/splash_icon.png',
      dark: {
        image: './resource/splash_icon_dark.png',
        backgroundColor: '#000000',
      },
      imageWidth: 200,
    }],
  ],
}
```

Place your images here and adjust paths in `app.config.ts`.
