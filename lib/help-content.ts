import type { Locale } from "@/lib/i18n/dictionaries";

export type InstallMethod = {
  title: string;
  steps: string[];
  note?: string;
};

export type InstallGuideSection = {
  id: "pc" | "phone" | "tablet";
  title: string;
  summary: string;
  methods: InstallMethod[];
};

export type HelpTip = {
  title: string;
  body: string;
};

type HelpBundle = {
  intro: string;
  inAppBrowserWarning: { title: string; body: string };
  guides: InstallGuideSection[];
  tips: HelpTip[];
};

const zh: HelpBundle = {
  intro:
    "把小小作息添加到桌面或主屏幕后，可以像 App 一样一键打开、全屏使用，不用每次再打开浏览器找网址。打卡记录保存在账号中，换设备登录也能继续。",
  inAppBrowserWarning: {
    title: "请先用系统浏览器打开",
    body: "在微信、QQ、抖音等 App 内打开时，通常无法添加到桌面。请点右上角 ⋯，选择「在 Safari 中打开」或「在浏览器中打开」，再用下面的步骤安装。",
  },
  guides: [
    {
      id: "pc",
      title: "电脑",
      summary: "Windows 和 macOS 都支持把网站安装成独立应用，图标会出现在桌面、开始菜单或程序坞。",
      methods: [
        {
          title: "Chrome / Edge（Windows、macOS）",
          steps: [
            "用 Chrome 或 Edge 打开小小作息。",
            "看地址栏右侧是否出现安装图标（显示器形状）。有的话直接点它。",
            "如果没有图标：点右上角 ⋮ 或 ⋯，选择「安装小小作息」；Edge 也可走「应用」→「安装此站点为应用」。",
            "在弹出窗口中确认「安装」。桌面、开始菜单（Windows）或启动台（macOS）会出现图标。",
          ],
          note: "安装后请从桌面图标打开，会以独立窗口运行，没有浏览器标签栏。",
        },
        {
          title: "Safari（macOS）",
          steps: [
            "用 Safari 打开小小作息。",
            "点菜单栏「文件」→「添加到程序坞」；也可以点工具栏的分享按钮，再选「添加到程序坞」。",
            "确认名称后添加。之后可从程序坞或启动台打开。",
          ],
          note: "需要较新的 Safari。若没有「添加到程序坞」，请先更新 macOS，或改用 Chrome / Edge。",
        },
      ],
    },
    {
      id: "phone",
      title: "手机",
      summary: "添加到主屏幕后，图标会和其他 App 排在一起，点开即全屏使用。",
      methods: [
        {
          title: "iPhone（Safari）",
          steps: [
            "用 Safari 打开小小作息（不要用微信内置页面）。",
            "点底部中间的分享按钮（方框加向上箭头）。",
            "在弹出菜单中下滑，找到「添加到主屏幕」。若没看到，可左右滑动查看更多操作。",
            "确认名称后点右上角「添加」。主屏幕会出现小小作息图标。",
          ],
          note: "请优先使用 Safari。Chrome 等浏览器也可在分享菜单里尝试「添加到主屏幕」，但 Safari 最稳定。",
        },
        {
          title: "Android（Chrome）",
          steps: [
            "用 Chrome 打开小小作息。",
            "若页面底部出现「添加到主屏幕」或「安装应用」提示，直接点安装。",
            "没有提示时：点右上角 ⋮，选择「安装应用」或「添加到主屏幕」。",
            "确认后，主屏幕或应用抽屉会出现图标。",
          ],
          note: "部分国产手机系统可能把入口写在「添加到主屏幕」或「添加到桌面」。华为、小米等也可在系统浏览器的菜单里找到相同选项。",
        },
      ],
    },
    {
      id: "tablet",
      title: "平板",
      summary: "iPad 和 Android 平板的步骤与手机类似，分享按钮多半在顶部工具栏。",
      methods: [
        {
          title: "iPad（Safari）",
          steps: [
            "用 Safari 打开小小作息。",
            "点顶部工具栏的分享按钮（方框加向上箭头）。",
            "选择「添加到主屏幕」；也可以选「添加到程序坞」，方便从底部栏打开。",
            "确认名称后点「添加」。",
          ],
          note: "请用 Safari 完成添加。从主屏幕或程序坞的图标打开，才会全屏运行。",
        },
        {
          title: "Android 平板（Chrome）",
          steps: [
            "用 Chrome 打开小小作息。",
            "点右上角 ⋮，选择「安装应用」或「添加到主屏幕」。",
            "确认安装。主屏幕会出现图标，点开即可全屏使用。",
          ],
        },
      ],
    },
  ],
  tips: [
    {
      title: "安装后怎么打开？",
      body: "请点桌面、主屏幕或程序坞上的图标。如果仍从浏览器书签打开，看起来会像普通网页，而不是独立应用。",
    },
    {
      title: "找不到「添加到主屏幕」？",
      body: "先确认不是在微信等 App 内打开。iPhone / iPad 请用 Safari；电脑和 Android 请用 Chrome 或 Edge。Firefox 对安装支持较弱，建议换浏览器。",
    },
    {
      title: "作息提醒怎么更稳？",
      body: "安装后请从主屏幕图标打开，再到「设置」开启推送提醒。从浏览器标签页打开时，部分设备上通知可能不稳定。",
    },
    {
      title: "换设备后记录还在吗？",
      body: "在。打卡与设置跟随账号，不依赖这台设备上的图标。新设备安装后再登录即可继续。",
    },
  ],
};

const en: HelpBundle = {
  intro:
    "Add Little Routine to your desktop or home screen to open it like an app—full screen, one tap, no hunting for the URL. Check-ins stay with your account across devices.",
  inAppBrowserWarning: {
    title: "Open in a system browser first",
    body: "In-app browsers (WeChat, QQ, Douyin, etc.) usually cannot install to the home screen. Tap ⋯ and choose “Open in Safari” or “Open in browser”, then follow the steps below.",
  },
  guides: [
    {
      id: "pc",
      title: "Computer",
      summary: "Windows and macOS can install the site as an app on the desktop, Start menu, or Dock.",
      methods: [
        {
          title: "Chrome / Edge (Windows, macOS)",
          steps: [
            "Open Little Routine in Chrome or Edge.",
            "Look for an install icon (monitor shape) on the right of the address bar and click it if present.",
            "If missing: open ⋮ / ⋯ and choose “Install Little Routine”; on Edge you can also use Apps → Install this site as an app.",
            "Confirm Install. An icon appears on the desktop, Start menu (Windows), or Launchpad (macOS).",
          ],
          note: "Launch from the icon for a standalone window without browser tabs.",
        },
        {
          title: "Safari (macOS)",
          steps: [
            "Open Little Routine in Safari.",
            "Choose File → Add to Dock, or use the Share button → Add to Dock.",
            "Confirm the name. Open later from the Dock or Launchpad.",
          ],
          note: "Needs a recent Safari. If Add to Dock is missing, update macOS or use Chrome / Edge.",
        },
      ],
    },
    {
      id: "phone",
      title: "Phone",
      summary: "After adding to the home screen, the icon sits with your other apps and opens full screen.",
      methods: [
        {
          title: "iPhone (Safari)",
          steps: [
            "Open Little Routine in Safari (not an in-app browser).",
            "Tap the Share button (square with an upward arrow) at the bottom.",
            "Scroll and choose Add to Home Screen. Swipe the action row if you do not see it.",
            "Confirm the name and tap Add. The Little Routine icon appears on the home screen.",
          ],
          note: "Prefer Safari. Other browsers may offer Add to Home Screen, but Safari is most reliable.",
        },
        {
          title: "Android (Chrome)",
          steps: [
            "Open Little Routine in Chrome.",
            "If you see an Add to Home screen / Install app banner, use it.",
            "Otherwise tap ⋮ and choose Install app or Add to Home screen.",
            "Confirm. The icon appears on the home screen or app drawer.",
          ],
          note: "Some Android skins label the action Add to desktop. Check your system browser menu too.",
        },
      ],
    },
    {
      id: "tablet",
      title: "Tablet",
      summary: "iPad and Android tablets work like phones; the Share control is often in the top toolbar.",
      methods: [
        {
          title: "iPad (Safari)",
          steps: [
            "Open Little Routine in Safari.",
            "Tap Share in the top toolbar (square with an upward arrow).",
            "Choose Add to Home Screen, or Add to Dock for quick access.",
            "Confirm and tap Add.",
          ],
          note: "Use Safari and open from the home screen or Dock icon for full-screen mode.",
        },
        {
          title: "Android tablet (Chrome)",
          steps: [
            "Open Little Routine in Chrome.",
            "Tap ⋮ and choose Install app or Add to Home screen.",
            "Confirm. Open from the home-screen icon for full screen.",
          ],
        },
      ],
    },
  ],
  tips: [
    {
      title: "How should I open it after install?",
      body: "Use the desktop, home screen, or Dock icon. Opening a browser bookmark still looks like a normal webpage.",
    },
    {
      title: "Cannot find Add to Home Screen?",
      body: "Make sure you are not inside WeChat or similar. Use Safari on iPhone/iPad; Chrome or Edge on computer and Android. Firefox install support is weaker.",
    },
    {
      title: "More reliable sleep reminders",
      body: "After installing, open from the home-screen icon, then enable push in Settings. Notifications can be flaky when you only use a browser tab.",
    },
    {
      title: "Do records survive a new device?",
      body: "Yes. Check-ins follow your account, not the icon. Install on the new device and sign in again.",
    },
  ],
};

export function getHelpContent(locale: Locale): HelpBundle {
  return locale === "en" ? en : zh;
}
