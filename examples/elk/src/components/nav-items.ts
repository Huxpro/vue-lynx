export interface NavigationContext {
  authenticated: boolean;
  server: string;
}

export interface MoreMenuContext extends NavigationContext {
  activePath: string;
}

export interface NavigationItem {
  key: string;
  label: string;
  icon: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  kind?: 'route' | 'more';
}

function isActivePath(activePath: string, to?: string, exact = false): boolean {
  if (!to)
    return false;
  return exact ? activePath === to : activePath === to || activePath.startsWith(`${to}/`);
}

export function buildBottomTabs({ authenticated, server }: NavigationContext): NavigationItem[] {
  if (authenticated) {
    return [
      { key: 'home', label: 'Home', icon: 'home-5-line', to: '/home', kind: 'route' },
      { key: 'search', label: 'Search', icon: 'search-line', to: '/search', kind: 'route' },
      { key: 'notifications', label: 'Notifications', icon: 'notification-4-line', to: '/notifications', kind: 'route' },
      { key: 'favorites', label: 'Favorites', icon: 'heart-3-line', to: '/favourites', kind: 'route' },
      { key: 'more', label: 'More menu', icon: 'more-fill', kind: 'more' },
    ];
  }

  return [
    { key: 'explore', label: 'Explore', icon: 'compass-3-line', to: `/${server}/explore`, kind: 'route' },
    { key: 'local', label: 'Local', icon: 'group-2-line', to: `/${server}/public/local`, kind: 'route' },
    { key: 'federated', label: 'Federated', icon: 'earth-line', to: `/${server}/public`, kind: 'route' },
    { key: 'more', label: 'More menu', icon: 'more-fill', kind: 'more' },
  ];
}

export function buildMoreMenuItems({
  authenticated,
  server,
  activePath,
}: MoreMenuContext): NavigationItem[] {
  const items: Array<NavigationItem & { auth?: boolean; exact?: boolean }> = [
    { key: 'search', label: 'Search', icon: 'search-line', to: '/search' },
    { key: 'home', label: 'Home', icon: 'home-5-line', to: '/home', auth: true },
    { key: 'notifications', label: 'Notifications', icon: 'notification-4-line', to: '/notifications', auth: true },
    { key: 'conversations', label: 'Conversations', icon: 'at-line' },
    { key: 'favorites', label: 'Favorites', icon: 'heart-3-line', to: '/favourites', auth: true },
    { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark-line', to: '/bookmarks', auth: true },
    { key: 'compose', label: 'Compose', icon: 'quill-pen-line', to: '/compose', auth: true },
    { key: 'scheduled', label: 'Scheduled posts', icon: 'calendar-line' },
    { key: 'explore', label: 'Explore', icon: 'compass-3-line', to: `/${server}/explore` },
    { key: 'local', label: 'Local', icon: 'group-2-line', to: `/${server}/public/local` },
    { key: 'federated', label: 'Federated', icon: 'earth-line', to: `/${server}/public`, exact: true },
    { key: 'lists', label: 'Lists', icon: 'links-line' },
    { key: 'hashtags', label: 'Hashtags', icon: 'hashtag' },
    { key: 'settings', label: 'Settings', icon: 'settings-3-line', to: '/settings' },
  ];

  return items.map(({ auth, exact, ...item }) => ({
    ...item,
    active: isActivePath(activePath, item.to, exact),
    disabled: !item.to || (auth === true && !authenticated),
  }));
}
