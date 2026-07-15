const tree = { kind: "rendered-tree", minNodes: 1 };

function smoke(text) {
  return {
    interactive: false,
    actions: [],
    assertions: text ? [tree, { kind: "text", includes: text }] : [tree],
  };
}

function tap(text, assertionText) {
  return {
    interactive: true,
    actions: [{ kind: "tap-text", text }],
    assertions: [tree, { kind: "text", includes: assertionText ?? text }],
  };
}

function input(placeholder, value, assertionText) {
  return {
    interactive: true,
    actions: [{ kind: "input", placeholder, value }],
    assertions: [tree, { kind: "text", includes: assertionText }],
  };
}

function indexedInput(index, value, expectedValue) {
  return {
    interactive: true,
    actions: [{ kind: "input", index, value }],
    assertions: [tree, { kind: "input-value", index: index + 1, equals: expectedValue }],
  };
}

export const scenarios = {
  "7guis/cells": smoke(),
  // The greeting always starts with "Good …". The app probes its optional
  // local API server (localhost:3210) and falls back to the in-memory
  // backend — that probe's connection failure is expected, not a defect.
  "ai-chat/main": {
    ...smoke("Good"),
    allowedRequestFailures: [/^http:\/\/localhost:3210\//],
  },
  "7guis/circle-drawer": tap("Undo"),
  "7guis/counter": tap("Count"),
  "7guis/crud": tap("Create"),
  "7guis/flight-booker": tap("Book"),
  "7guis/temperature-converter": indexedInput(0, "100", "212"),
  "7guis/timer": tap("Reset"),
  "basic/h-counter": tap("Tap to increment", "h() counter"),
  "basic/main": tap("Tap to increment", "History"),
  "css-features/main": smoke("CSS"),
  // Guest-mode Mastodon client against a live public instance — remote
  // content is not deterministic, so only the rendered shell is asserted.
  "elk/main": smoke(),
  "event-modifiers/main": tap("Tap", "Event Modifiers"),
  "gallery/GalleryAutoScroll": smoke(),
  "gallery/GalleryComplete": smoke(),
  "gallery/GalleryList": smoke(),
  "gallery/GalleryScrollbar": smoke(),
  "gallery/GalleryScrollbarCompare": smoke(),
  "gallery/ImageCard": smoke(),
  "gallery/LikeCard": smoke(),
  "hackernews-css/main": smoke(),
  "hackernews-tailwind/main": smoke(),
  "hello-world/main": smoke("Vue"),
  "keep-alive/main": tap("Increment", "KeepAlive"),
  "main-thread/background-draggable": smoke(),
  "main-thread/cross-thread-calls": tap("Tap count", "Tap count: 1"),
  "main-thread/main-thread-draggable": smoke(),
  "main-thread/main-thread-draggable-raw": smoke(),
  "main-thread/shared-module": tap("Tap to cycle", "Color 2/5"),
  "networking/main": input("Search users", "Leanne", "Vue Query"),
  "option-api/main": tap("Tap to increment", "Options API"),
  "pinia/main": tap("+", "Count: 1"),
  "provide-inject/main": tap("Toggle", "Provide"),
  "reactivity/main": tap("Birthday", "Age: 31"),
  "slots/main": smoke("Slots"),
  "suspense/main": smoke("Suspense"),
  "swiper/Swiper": smoke("Order Now"),
  "swiper/SwiperEmpty": smoke("Order Now"),
  "swiper/SwiperMTS": smoke("Order Now"),
  "tailwindcss/main": smoke("Settings"),
  "todomvc-codex/main": input("What needs to be done", "verify Vapor", "todos"),
  "todomvc-day1/main": input("What needs to be done", "verify Vapor", "todos"),
  "todomvc/main": input("What needs to be done", "verify Vapor", "todos"),
  "transition/transition": tap("Toggle", "Transition"),
  "v-model/main": tap("Reset from parent", "v-model"),
  "vapor/main": tap("+", "History:"),
  "vue-router/main": tap("Users", "Vue Router"),
};
