class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.menuContent = this.querySelector('.mega-menu__content');
    this.closeTimeout = null;

    /* Hover 打开/关闭 mega menu（仅桌面端） */
    this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    /* 在弹窗内容区域也监听鼠标事件，防止关闭 */
    if (this.menuContent) {
      this.menuContent.addEventListener('mouseenter', this.onContentMouseEnter.bind(this));
      this.menuContent.addEventListener('mouseleave', this.onContentMouseLeave.bind(this));
    }
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  onMouseEnter() {
    if (!this.isDesktop()) return;
    // 清除可能存在的关闭定时器
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    if (!this.mainDetailsToggle.hasAttribute('open')) {
      this.mainDetailsToggle.setAttribute('open', '');
      this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', true);
    }
  }

  onMouseLeave(event) {
    if (!this.isDesktop()) return;
    // 检查鼠标是否移动到弹窗内容区域
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && (this.menuContent && this.menuContent.contains(relatedTarget))) {
      return; // 鼠标移动到弹窗内容，不关闭
    }
    // 添加短暂延迟，防止快速移动时误关闭
    this.closeTimeout = setTimeout(() => {
      this.close();
    }, 100);
  }

  onContentMouseEnter() {
    if (!this.isDesktop()) return;
    // 鼠标进入弹窗内容区域，清除关闭定时器
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  onContentMouseLeave(event) {
    if (!this.isDesktop()) return;
    // 检查鼠标是否移回到菜单项区域
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && this.contains(relatedTarget)) {
      return; // 鼠标移回到菜单区域，不关闭
    }
    // 添加短暂延迟，防止快速移动时误关闭
    this.closeTimeout = setTimeout(() => {
      this.close();
    }, 100);
  }
}

customElements.define('header-menu', HeaderMenu);
