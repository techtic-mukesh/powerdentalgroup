

document.addEventListener('DOMContentLoaded', function () {
    let items = document.querySelectorAll(".header__inline-menu details summary");

    items.forEach((item) => {
        // Skip the Products menu (has class 'Products')
        let parentLi = item.closest('li');
        if (parentLi && parentLi.classList.contains('Products')) return;

        item.addEventListener("mouseover", () => {
            item.setAttribute("open", "true");
            let megaMenu = item.querySelector(".mega-menu__content");
            if (megaMenu) megaMenu.style.display = 'block';
        });

        item.addEventListener("mouseleave", () => {
            item.removeAttribute("open");
            let megaMenu = item.querySelector(".mega-menu__content");
            if (megaMenu) megaMenu.style.display = 'none';
        });
    });
});

$(document).ready(function () {
  /** -------------------------------
   * 1. Move menu on load
   * ------------------------------- */
  $('#HeaderMenu-MenuList-1').insertAfter('.top-inline-bar');

  /** -------------------------------
   * 2. Hover logic for all menus except "Products"
   * ------------------------------- */
  $(".header__inline-menu details").each(function () {
    const $details = $(this);
    const $summary = $details.find("summary").first();
    const $megaMenu = $details.find(".mega-menu__content");
    const $submenu = $details.find("ul.header__submenu");
    const $parentLi = $details.closest("li");

    // Skip Products menu
    if ($parentLi.hasClass("Products")) return;

    // Hide menus initially
    if ($megaMenu.length) $megaMenu.hide();
    if ($submenu.length) $submenu.hide();

    // Hover open
    $details.on("mouseenter", function () {
      $details.attr("open", "true");

      if ($megaMenu.length) {
        $megaMenu.stop(true, true)
          .css({ display: "block", height: 0, opacity: 0 })
          .animate({ height: $megaMenu.get(0).scrollHeight, opacity: 1 }, 300);
      }

      if ($submenu.length) {
        $submenu.stop(true, true)
          .css({ display: "block", height: 0, opacity: 0 })
          .animate({ height: $submenu.get(0).scrollHeight, opacity: 1 }, 300);
      }
    });

    // Hover close
    $details.on("mouseleave", function () {
      $details.removeAttr("open");

      if ($megaMenu.length) {
        $megaMenu.stop(true, true)
          .animate({ height: 0, opacity: 0 }, 300, function () {
            $(this).hide();
          });
      }

      if ($submenu.length) {
        $submenu.stop(true, true)
          .animate({ height: 0, opacity: 0 }, 300, function () {
            $(this).hide();
          });
      }
    });

    // Click redirect to data-url
    $summary.on("click", function (e) {
      e.preventDefault();
      const targetUrl = $details.attr("data-url");
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  });

  /** -------------------------------
   * 3. Click behavior for "Products" mega menu
   * ------------------------------- */
  const dropdownBtn = document.querySelector('.mega-dropdown');
  const detailsMenu = document.querySelector('#Details-HeaderMenu-1');

  if (dropdownBtn && detailsMenu) {
    const $detailsMenu = $(detailsMenu);

    // Remove any hover logic if exists
    $detailsMenu.off('mouseenter mouseleave');

    // Click toggle
    dropdownBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = $('body').hasClass('mega-menu-open');

      if (isOpen) {
        $('body').removeClass('mega-menu-open');
        $detailsMenu.removeAttr('open');
        $('.mega-menu__content', $detailsMenu).slideUp(300);
      } else {
        $('body').addClass('mega-menu-open');
        $detailsMenu.attr('open', 'true');
        $('.mega-menu__content', $detailsMenu).slideDown(300);
      }
    });

    // Close when clicking outside
    $(document).on('click', function (e) {
      if (!$(e.target).closest('.mega-dropdown, #Details-HeaderMenu-1').length) {
        $('body').removeClass('mega-menu-open');
        $detailsMenu.removeAttr('open');
        $('.mega-menu__content', $detailsMenu).slideUp(300);
      }
    });
  }
});

