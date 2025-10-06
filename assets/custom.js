

$(function () {
    $('.mega-dropdown').hover(
    function () {
      // On mouseenter: open the menu
      const $details = $('#Details-HeaderMenu-1'); // target the menu
      if (!$details.attr('open')) {
        $details.attr('open', true); // open details
        $details.trigger('mouseenter'); // trigger your existing hover animation
      }
    },
    function () {
      // On mouseleave: close the menu
      const $details = $('#Details-HeaderMenu-1');
      if ($details.attr('open')) {
        $details.trigger('mouseleave'); // trigger your existing hover out animation
        $details.removeAttr('open');
      }
    }
  );

  // Optional: also close the menu if the mouse leaves the menu itself
  $('#Details-HeaderMenu-1').mouseleave(function () {
    const $details = $(this);
    $details.trigger('mouseleave');
    $details.removeAttr('open');
  });
  // For each details (top-level menu item)
  $('.header__inline-menu details').each(function () {
    const $item = $(this);
    // look for both normal submenus and mega menu content
    const $menus = $item.find('ul.header__submenu, .mega-menu__content');

    // If no submenu/mega content -> skip
    if (!$menus.length) return;

    // Ensure initial state - hidden, zero height, hidden overflow
    $menus.each(function () {
      $(this).css({
        display: 'none',
        height: 0,
        opacity: 0,
        overflow: 'hidden'
      });
    });

    // Hover in
    $item.on('mouseenter', function () {
      $menus.each(function () {
        const $m = $(this);

        // stop any running animations
        $m.stop(true, true);

        // make visible but start from 0 height so measurement is correct
        $m.css({
          display: 'block',
          height: 0,
          opacity: 0,
          overflow: 'hidden'
        });

        // Force reflow so browser applies height:0 before measuring
        $m.get(0).offsetHeight;

        // measure real target height
        const targetHeight = $m.get(0).scrollHeight;

        // animate to measured height, then set height to auto (responsive)
        $m.animate({ height: targetHeight, opacity: 1 }, 300, function () {
          $m.css({ height: 'auto', overflow: '' });
        });
      });

      // set details open attribute for accessibility / native styles
      $item.attr('open', 'true');

      // initialize tabs once per details (if present)
      const $tabsMenu = $item.find('.tabs-menu').first();
      if ($tabsMenu.length && !$tabsMenu.data('tabs-initialized')) {
        initTabs($tabsMenu);
        $tabsMenu.data('tabs-initialized', true);
      }
    });

    // Hover out
    $item.on('mouseleave', function () {
      $menus.each(function () {
        const $m = $(this);

        // stop running animations
        $m.stop(true, true);

        // If height is 'auto', force it to its current pixel height so animation works
        const currentHeight = $m.outerHeight();
        $m.css({ height: currentHeight + 'px', overflow: 'hidden' });

        // Force reflow
        $m.get(0).offsetHeight;

        // animate back to zero and hide at the end
        $m.animate({ height: 0, opacity: 0 }, 300, function () {
          $m.css({ display: 'none', height: 0, overflow: '', opacity: 0 });
        });
      });

      $item.removeAttr('open');
    });
  });

  // Initialize tabs within a specific tabs-menu element
  function initTabs($tabsMenu) {
    const $navItems = $tabsMenu.find('#tabs-nav li.tabs-li');
    const $contents = $tabsMenu.find('.tab-content');

    // reset & show first
    $navItems.removeClass('active');
    $navItems.filter(':visible').first().addClass('active');
    $contents.hide().first().show();

    // click handler per tabs-menu (safe, attaches only once per menu)
    $tabsMenu.on('click', '#tabs-nav li.tabs-li', function (e) {
      e.preventDefault();
      e.stopPropagation(); // prevent closing the details via click bubbling

      const $li = $(this);
      const target = $li.find('a').attr('href');

      $li.addClass('active').siblings().removeClass('active');

      $contents.hide();
      $tabsMenu.find(target).fadeIn(200);
    });
  }
});


document.addEventListener("DOMContentLoaded", function() {
  const dropdownButton = document.querySelector(".mega-dropdown");
  const firstMenu = document.querySelector(".mega-menu--dropdown-wrapper");

  if (!dropdownButton || !firstMenu) return;

  // Hide menu initially
  firstMenu.style.display = "none";
  firstMenu.style.opacity = "0";
  firstMenu.style.transition = "opacity 0.3s ease, height 0.3s ease";

  // When hover starts
  dropdownButton.addEventListener("mouseenter", () => {
    firstMenu.style.display = "block";
    firstMenu.style.height = "auto"; // so it adjusts properly
    const height = firstMenu.scrollHeight + "px";
    firstMenu.style.height = "0";
    setTimeout(() => {
      firstMenu.style.height = height;
      firstMenu.style.opacity = "1";
    }, 10);
  });

  // When hover ends
  dropdownButton.addEventListener("mouseleave", () => {
    firstMenu.style.height = "0";
    firstMenu.style.opacity = "0";
    setTimeout(() => {
      firstMenu.style.display = "none";
    }, 300);
  });

  // If you want the same behavior when mouse leaves the menu too
  firstMenu.addEventListener("mouseleave", () => {
    firstMenu.style.height = "0";
    firstMenu.style.opacity = "0";
    setTimeout(() => {
      firstMenu.style.display = "none";
    }, 300);
  });
});

