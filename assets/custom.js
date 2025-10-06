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


 


//     async function addToWishlist() {
//   try {
//     alert('Adding to wishlist...');

//     const response = await fetch('https://api.myshopapps.com/wishlist/V2/addToWishlist', {
//       method: 'POST',
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'xtoken': 'IWISH_API_c1366439955011f0a0270e72f2521631', // replace with your valid token
//       },
//       body: new URLSearchParams({
//         customer_id: '0', // or actual customer ID if logged in
//         product_id: '8493757825174',
//         variant_id: '45626803191958',
//         category_id: '0',
//         product_qty: '1'
//       })
//     });

//     const data = await response.json();

//     if (response.ok) {
//       alert('✅ Product added to wishlist successfully!');
//       console.log('Success:', data);
//     } else {
//       alert('❌ Failed to add to wishlist: ' + (data.message || 'Unknown error'));
//       console.error('Error:', data);
//     }
//   } catch (error) {
//     alert('❌ Error: Unable to add to wishlist. Please try again.');
//     console.error('Network Error:', error);
//   }
// }

// addToWishlist();


});




