import type { SVGProps } from 'react';

import {
  getIconForFile,
  DEFAULT_FOLDER,
  DEFAULT_FOLDER_OPENED,
} from 'vscode-icons-js';

export function CarbonDocumentBlank(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      focusable="false"
      width="1em"
      height="1em"
      viewBox="0 0 32 32"
      {...props}
    >
      <path
        d="M25.7 9.3l-7-7A.908.908 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.908.908 0 0 0-.3-.7zM18 4.4l5.6 5.6H18zM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6z"
        fill="currentColor"
      />
    </svg>
  );
}
export function IconGithub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

export function IconCopyLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 15 15"
      fill="none"
      {...props}
    >
      <path
        d="M3.61133 2.98688V2.10598C3.61133 1.60735 4.01554 1.20312 4.51419 1.20312H12.3389C12.8376 1.20312 13.2418 1.60735 13.2418 2.10598V9.93074C13.2418 10.4294 12.8376 10.8336 12.3389 10.8336H11.4413"
        stroke="currentColor"
        strokeWidth="1.20381"
      />
      <path
        d="M10.5336 3.00977H2.10696C1.60832 3.00977 1.2041 3.41399 1.2041 3.91262V12.3393C1.2041 12.8379 1.60832 13.2421 2.10696 13.2421H10.5336C11.0323 13.2421 11.4365 12.8379 11.4365 12.3393V3.91262C11.4365 3.41399 11.0323 3.00977 10.5336 3.00977Z"
        stroke="currentColor"
        strokeWidth="1.20381"
        strokeLinejoin="round"
      />
      <path
        d="M5.54932 6.95418L7.14211 5.29608C7.57897 4.85919 8.29692 4.86882 8.74567 5.31757C9.19442 5.76632 9.20405 6.48427 8.76716 6.92114L8.19231 7.5299"
        stroke="currentColor"
        strokeWidth="1.20381"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.05278 8.65039C3.89921 8.80397 3.58164 9.11064 3.58164 9.11064C3.14475 9.5475 3.13289 10.3262 3.58164 10.7749C4.03039 11.2237 4.74831 11.2333 5.18521 10.7964L6.73939 9.38544"
        stroke="currentColor"
        strokeWidth="1.20381"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.61639 8.52544C5.40795 8.317 5.29425 8.05048 5.27604 7.781C5.25504 7.47036 5.36094 7.15581 5.5949 6.92188"
        stroke="currentColor"
        strokeWidth="1.20381"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.71777 7.7832C7.16652 8.23195 7.17615 8.94991 6.73926 9.38677"
        stroke="currentColor"
        strokeWidth="1.20381"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEnterFullscreen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconExitFullscreen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <path
        d="M9 9V5M9 9H5M15 9V5M15 9h4M9 15v4M9 15H5M15 15v4M15 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconsBaseUrl =
  'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/vscode-icons';

export function getFolderIcon(isExpanded: boolean) {
  const name = isExpanded ? DEFAULT_FOLDER_OPENED : DEFAULT_FOLDER;
  const link = `${iconsBaseUrl}/${name}`;
  return (props: Record<string, unknown>) => (
    <img width="18px" height="18px" {...props} src={link} alt="" />
  );
}

export function getFileIcon(filename: string) {
  const iconPath = getIconForFile(filename);
  if (iconPath) {
    const link = `${iconsBaseUrl}/${iconPath}`;
    return (props: Record<string, unknown>) => (
      <img width="18px" height="18px" {...props} src={link} alt="" />
    );
  }

  return CarbonDocumentBlank;
}
