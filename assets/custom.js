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
    // Move menu on load
    $('#HeaderMenu-MenuList-1').insertAfter('.top-inline-bar');

    // Hover logic for other menus (except Products)
    $(".header__inline-menu details summary").each(function () {
        let $parentLi = $(this).closest('li');
        if ($parentLi.hasClass('Products')) return;

        let $item = $(this);
        let $megaMenu = $item.find(".mega-menu__content");
        let $submenu = $item.find("ul.header__submenu");

        if ($megaMenu.length) $megaMenu.hide();
        if ($submenu.length) $submenu.hide();

        $item.on("mouseenter", function () {
            $item.attr("open", "true");

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

            $summary.on("click", function (e) {
      e.preventDefault();
      const targetUrl = $details.attr("data-url");
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
        });

        $item.on("mouseleave", function () {
            $item.removeAttr("open");

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
    });

    /** CLICK BEHAVIOR FOR PRODUCTS MENU **/
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
