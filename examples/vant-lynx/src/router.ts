import { createRouter, createMemoryHistory } from 'vue-router';
import Index from './pages/index.vue';
import ButtonDemo from './pages/button.vue';
import CellDemo from './pages/cell.vue';
import IconDemo from './pages/icon.vue';
import ImageDemo from './pages/image.vue';
import LoadingDemo from './pages/loading.vue';
import TagDemo from './pages/tag.vue';
import BadgeDemo from './pages/badge.vue';
import DividerDemo from './pages/divider.vue';
import SpaceDemo from './pages/space.vue';
import LayoutDemo from './pages/layout.vue';
import PopupDemo from './pages/popup.vue';
import OverlayDemo from './pages/overlay.vue';
import SwitchDemo from './pages/switch.vue';
import CheckboxDemo from './pages/checkbox.vue';
import RadioDemo from './pages/radio.vue';
import FieldDemo from './pages/field.vue';
import RateDemo from './pages/rate.vue';
import StepperDemo from './pages/stepper.vue';
import ProgressDemo from './pages/progress.vue';
import CircleDemo from './pages/circle.vue';
import CountDownDemo from './pages/count-down.vue';
import EmptyDemo from './pages/empty.vue';
import NoticeBarDemo from './pages/notice-bar.vue';
import NavBarDemo from './pages/nav-bar.vue';
import TabbarDemo from './pages/tabbar.vue';
import TabDemo from './pages/tab.vue';
import GridDemo from './pages/grid.vue';
import CollapseDemo from './pages/collapse.vue';
import StepsDemo from './pages/steps.vue';
import ToastDemo from './pages/toast.vue';
import ActionSheetDemo from './pages/action-sheet.vue';
import SearchDemo from './pages/search.vue';
import SliderDemo from './pages/slider.vue';
import HighlightDemo from './pages/highlight.vue';
import CascaderDemo from './pages/cascader.vue';
import UploaderDemo from './pages/uploader.vue';
import NumberKeyboardDemo from './pages/number-keyboard.vue';
import PasswordInputDemo from './pages/password-input.vue';
import BarrageDemo from './pages/barrage.vue';
import CalendarDemo from './pages/calendar.vue';
import FormDemo from './pages/form.vue';
import DatePickerDemo from './pages/date-picker.vue';
import TimePickerDemo from './pages/time-picker.vue';
import SkeletonDemo from './pages/skeleton.vue';
import CardDemo from './pages/card.vue';
import PaginationDemo from './pages/pagination.vue';
import StickyDemo from './pages/sticky.vue';
import SwipeDemo from './pages/swipe.vue';
import TextEllipsisDemo from './pages/text-ellipsis.vue';
import WatermarkDemo from './pages/watermark.vue';
import ActionBarDemo2 from './pages/action-bar.vue';
import BackTopDemo from './pages/back-top.vue';
import IndexBarDemo from './pages/index-bar.vue';
import SidebarDemo from './pages/sidebar.vue';
import ImagePreviewDemo from './pages/image-preview.vue';
import ListDemo from './pages/list.vue';
import PopoverDemo from './pages/popover.vue';
import RollingTextDemo from './pages/rolling-text.vue';
import TreeSelectDemo from './pages/tree-select.vue';
import AddressEditDemo from './pages/address-edit.vue';
import AddressListDemo from './pages/address-list.vue';
import AreaDemo from './pages/area.vue';
import ContactCardDemo from './pages/contact-card.vue';
import ContactEditDemo from './pages/contact-edit.vue';
import ContactListDemo from './pages/contact-list.vue';
import CouponListDemo from './pages/coupon-list.vue';
import SubmitBarDemo from './pages/submit-bar.vue';
import SignatureDemo from './pages/signature.vue';
import PullRefreshDemo from './pages/pull-refresh.vue';
import ConfigProviderDemo from './pages/config-provider.vue';
import DialogDemo from './pages/dialog.vue';
import DropdownMenuDemo from './pages/dropdown-menu.vue';
import FloatingBubbleDemo from './pages/floating-bubble.vue';
import FloatingPanelDemo from './pages/floating-panel.vue';
import NotifyDemo from './pages/notify.vue';
import PickerDemo from './pages/picker.vue';
import ShareSheetDemo from './pages/share-sheet.vue';
import SwipeCellDemo from './pages/swipe-cell.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Index },
    { path: '/button', name: 'button', component: ButtonDemo },
    { path: '/cell', name: 'cell', component: CellDemo },
    { path: '/icon', name: 'icon', component: IconDemo },
    { path: '/image', name: 'image', component: ImageDemo },
    { path: '/loading', name: 'loading', component: LoadingDemo },
    { path: '/tag', name: 'tag', component: TagDemo },
    { path: '/badge', name: 'badge', component: BadgeDemo },
    { path: '/divider', name: 'divider', component: DividerDemo },
    { path: '/space', name: 'space', component: SpaceDemo },
    { path: '/layout', name: 'layout', component: LayoutDemo },
    { path: '/popup', name: 'popup', component: PopupDemo },
    { path: '/overlay', name: 'overlay', component: OverlayDemo },
    { path: '/switch', name: 'switch', component: SwitchDemo },
    { path: '/checkbox', name: 'checkbox', component: CheckboxDemo },
    { path: '/radio', name: 'radio', component: RadioDemo },
    { path: '/field', name: 'field', component: FieldDemo },
    { path: '/rate', name: 'rate', component: RateDemo },
    { path: '/stepper', name: 'stepper', component: StepperDemo },
    { path: '/progress', name: 'progress', component: ProgressDemo },
    { path: '/circle', name: 'circle', component: CircleDemo },
    { path: '/count-down', name: 'count-down', component: CountDownDemo },
    { path: '/empty', name: 'empty', component: EmptyDemo },
    { path: '/notice-bar', name: 'notice-bar', component: NoticeBarDemo },
    { path: '/nav-bar', name: 'nav-bar', component: NavBarDemo },
    { path: '/tabbar', name: 'tabbar', component: TabbarDemo },
    { path: '/tab', name: 'tab', component: TabDemo },
    { path: '/grid', name: 'grid', component: GridDemo },
    { path: '/collapse', name: 'collapse', component: CollapseDemo },
    { path: '/steps', name: 'steps', component: StepsDemo },
    { path: '/toast', name: 'toast', component: ToastDemo },
    { path: '/action-sheet', name: 'action-sheet', component: ActionSheetDemo },
    { path: '/search', name: 'search', component: SearchDemo },
    { path: '/slider', name: 'slider', component: SliderDemo },
    { path: '/highlight', name: 'highlight', component: HighlightDemo },
    { path: '/cascader', name: 'cascader', component: CascaderDemo },
    { path: '/uploader', name: 'uploader', component: UploaderDemo },
    { path: '/number-keyboard', name: 'number-keyboard', component: NumberKeyboardDemo },
    { path: '/password-input', name: 'password-input', component: PasswordInputDemo },
    { path: '/barrage', name: 'barrage', component: BarrageDemo },
    { path: '/calendar', name: 'calendar', component: CalendarDemo },
    { path: '/form', name: 'form', component: FormDemo },
    { path: '/date-picker', name: 'date-picker', component: DatePickerDemo },
    { path: '/time-picker', name: 'time-picker', component: TimePickerDemo },
    { path: '/skeleton', name: 'skeleton', component: SkeletonDemo },
    { path: '/card', name: 'card', component: CardDemo },
    { path: '/pagination', name: 'pagination', component: PaginationDemo },
    { path: '/sticky', name: 'sticky', component: StickyDemo },
    { path: '/swipe', name: 'swipe', component: SwipeDemo },
    { path: '/text-ellipsis', name: 'text-ellipsis', component: TextEllipsisDemo },
    { path: '/watermark', name: 'watermark', component: WatermarkDemo },
    { path: '/action-bar', name: 'action-bar', component: ActionBarDemo2 },
    { path: '/back-top', name: 'back-top', component: BackTopDemo },
    { path: '/index-bar', name: 'index-bar', component: IndexBarDemo },
    { path: '/sidebar', name: 'sidebar', component: SidebarDemo },
    { path: '/image-preview', name: 'image-preview', component: ImagePreviewDemo },
    { path: '/list', name: 'list', component: ListDemo },
    { path: '/popover', name: 'popover', component: PopoverDemo },
    { path: '/rolling-text', name: 'rolling-text', component: RollingTextDemo },
    { path: '/tree-select', name: 'tree-select', component: TreeSelectDemo },
    { path: '/address-edit', name: 'address-edit', component: AddressEditDemo },
    { path: '/address-list', name: 'address-list', component: AddressListDemo },
    { path: '/area', name: 'area', component: AreaDemo },
    { path: '/contact-card', name: 'contact-card', component: ContactCardDemo },
    { path: '/contact-edit', name: 'contact-edit', component: ContactEditDemo },
    { path: '/contact-list', name: 'contact-list', component: ContactListDemo },
    { path: '/coupon-list', name: 'coupon-list', component: CouponListDemo },
    { path: '/submit-bar', name: 'submit-bar', component: SubmitBarDemo },
    { path: '/signature', name: 'signature', component: SignatureDemo },
    { path: '/pull-refresh', name: 'pull-refresh', component: PullRefreshDemo },
    { path: '/config-provider', name: 'config-provider', component: ConfigProviderDemo },
    { path: '/dialog', name: 'dialog', component: DialogDemo },
    { path: '/dropdown-menu', name: 'dropdown-menu', component: DropdownMenuDemo },
    { path: '/floating-bubble', name: 'floating-bubble', component: FloatingBubbleDemo },
    { path: '/floating-panel', name: 'floating-panel', component: FloatingPanelDemo },
    { path: '/notify', name: 'notify', component: NotifyDemo },
    { path: '/picker', name: 'picker', component: PickerDemo },
    { path: '/share-sheet', name: 'share-sheet', component: ShareSheetDemo },
    { path: '/swipe-cell', name: 'swipe-cell', component: SwipeCellDemo },
  ],
});

export default router;
