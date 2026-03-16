const URL_PLACEHOLDER = '{{{url}}}';

export function getUrlFromMustacheSchema(
  schema: string,
  templateUrl?: string,
): string {
  if (!schema || !templateUrl) {
    return '';
  }

  const replaceUrlPlaceholder = (value: string): string => {
    return value.replace(URL_PLACEHOLDER, templateUrl);
  };

  const processSearchParam = (value: string): string => {
    if (!value.includes(URL_PLACEHOLDER)) {
      return value;
    }

    try {
      new URL(value);
      return replaceUrlInUrl(value);
    } catch {
      return replaceUrlPlaceholder(value);
    }
  };

  const replaceUrlInUrl = (urlLike: string): string => {
    try {
      const url = new URL(urlLike);
      const { searchParams } = url;

      searchParams.forEach((value, key) => {
        const newValue = processSearchParam(value);
        if (newValue !== value) {
          searchParams.set(key, newValue);
        }
      });

      return url.toString();
    } catch {
      return replaceUrlPlaceholder(urlLike);
    }
  };

  return replaceUrlInUrl(schema);
}

export const getCloneData = (data: unknown) => {
  if (typeof data === 'object') {
    return JSON.parse(JSON.stringify(data));
  }
  return data;
};

export const tabScrollToTop = (tabsRef: HTMLDivElement | null) => {
  if (tabsRef) {
    const activeTab = tabsRef.querySelector(
      '.semi-tabs-tab-active',
    ) as HTMLElement;
    const scrollContainer = activeTab?.parentNode as HTMLElement;
    if (activeTab && scrollContainer) {
      const scrollLeft =
        activeTab.offsetLeft -
        (scrollContainer.clientWidth - activeTab.offsetWidth) / 2;
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'auto',
      });
    }
  }
};
