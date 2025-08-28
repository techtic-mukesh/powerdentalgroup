document.addEventListener('DOMContentLoaded', function () {
    let items = document.querySelectorAll(".header__inline-menu details");

    items.forEach(item => {
        item.addEventListener("mouseover", () => {
            item.setAttribute("open", "true");
            item.querySelector(".mega-menu__content").style.display = 'block';
        });

        item.addEventListener("mouseleave", () => {
            item.removeAttribute("open");
            item.querySelector(".mega-menu__content").style.display = 'none';
        });
    });
});

$(document).ready(function () {
    $(".header__inline-menu details").each(function () {
        let $item = $(this);
        let $menu = $item.find("ul.header__submenu");

        // hide initially
        $menu.hide();

        // Hover in
        $item.on("mouseenter", function () {
            $menu.stop(true, true).css({ display: "block", height: 0, opacity: 0 })
                .animate({ height: $menu.get(0).scrollHeight, opacity: 1 }, 300);
        });

        // Hover out
        $item.on("mouseleave", function () {
            $menu.stop(true, true).animate({ height: 0, opacity: 0 }, 300, function () {
                $(this).hide();
            });
        });
    });
});
