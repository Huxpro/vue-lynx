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
  ],
});

export default router;
