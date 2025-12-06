/**
 * Collection Sidebar Popup Handler
 * 处理侧边栏弹出框的显示和隐藏
 */

class CollectionSidebarPopup {
  constructor() {
    this.sidebar = document.getElementById('CollectionSidebar');
    this.overlay = document.getElementById('CollectionSidebarOverlay');
    this.triggers = document.querySelectorAll('[data-alp-sidebar-popup-trigger]');
    this.closeButtons = document.querySelectorAll('[data-alp-sidebar-popup-close]');
    
    this.init();
  }

  init() {
    if (!this.sidebar || !this.overlay) {
      console.warn('Collection sidebar popup elements not found');
      return;
    }

    // 绑定触发按钮事件
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.show();
      });
    });

    // 绑定关闭按钮事件
    this.closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
      });
    });

    // 点击遮罩层关闭
    this.overlay.addEventListener('click', () => {
      this.hide();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });

    // 防止侧边栏内容点击时关闭弹出框
    this.sidebar.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  show() {
    // 显示遮罩层和侧边栏
    this.overlay.style.display = 'block';
    this.sidebar.style.display = 'block';
    
    // 防止页面滚动
    document.body.classList.add('sidebar-popup-open');
    
    // 延迟添加active类以触发动画
    setTimeout(() => {
      this.overlay.classList.add('active');
      this.sidebar.classList.add('active');
    }, 10);

    // 触发自定义事件
    this.dispatchEvent('sidebar:opened');
  }

  hide() {
    // 移除active类触发关闭动画
    this.overlay.classList.remove('active');
    this.sidebar.classList.remove('active');
    
    // 恢复页面滚动
    document.body.classList.remove('sidebar-popup-open');
    
    // 动画结束后隐藏元素
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.sidebar.style.display = 'none';
    }, 300); // 与CSS过渡时间匹配

    // 触发自定义事件
    this.dispatchEvent('sidebar:closed');
  }

  isVisible() {
    return this.sidebar.classList.contains('active');
  }

  toggle() {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  dispatchEvent(eventName) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      detail: { sidebar: this.sidebar }
    });
    document.dispatchEvent(event);
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  new CollectionSidebarPopup();
});

// 如果页面已经加载完成，立即初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CollectionSidebarPopup();
  });
} else {
  new CollectionSidebarPopup();
}
