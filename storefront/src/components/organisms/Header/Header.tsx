import { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import { Badge } from '@/components/atoms';
import { CartDropdown, MobileNavbar, Navbar } from '@/components/cells';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import CountrySelector from '@/components/molecules/CountrySelector/CountrySelector';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MessageButton } from '@/components/molecules/MessageButton/MessageButton';
import { ParentCategoryLinks } from '@/components/molecules/ParentCategoryLinks/ParentCategoryLinks';
import { HeartIcon } from '@/icons';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { listRegions } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import { Wishlist } from '@/types/wishlist';

export const Header = async () => {
  const user = await retrieveCustomer().catch(() => null);
  const isLoggedIn = Boolean(user);
  let wishlist: Wishlist[] = [];

  if (user) {
    const response = await getUserWishlists();
    wishlist = response.wishlists;
  }

  const regions = await listRegions();

  const wishlistCount = wishlist?.[0]?.products.length || 0;

  const { categories, parentCategories } = (await listCategories({
    query: { include_ancestors_tree: true }
  })) as {
    categories: HttpTypes.StoreProductCategory[];
    parentCategories: HttpTypes.StoreProductCategory[];
  };
  return (
    <header>
      <div className="flex px-4 py-2 md:px-5 lg:px-8">
        <div className="flex items-center lg:w-1/3">
          <MobileNavbar
            parentCategories={parentCategories}
            categories={categories}
          />
          <ParentCategoryLinks
            parentCategories={parentCategories}
            categories={categories}
          />
        </div>
        <div className="flex items-center pl-4 lg:w-1/3 lg:justify-center lg:pl-0">
          <LocalizedClientLink
            href="/"
            className="text-2xl font-bold"
          >
            <div className="font-bold text-2xl text-primary">
              Esirkah
            </div>
          </LocalizedClientLink>
        </div>
        <div className="flex w-full items-center justify-end gap-2 py-2 lg:w-1/3 lg:gap-4">
          {/*<CountrySelector regions={regions} />*/}
          {isLoggedIn && <MessageButton />}
          <UserDropdown isLoggedIn={isLoggedIn} />
          {isLoggedIn && (
            <LocalizedClientLink
              href="/user/wishlist"
              className="relative"
            >
              <HeartIcon size={20} />
              {Boolean(wishlistCount) && (
                <Badge className="absolute -right-2 -top-2 h-4 w-4 p-0">{wishlistCount}</Badge>
              )}
            </LocalizedClientLink>
          )}

          <CartDropdown />
        </div>
      </div>
      <Navbar
        categories={categories}
        parentCategories={parentCategories}
      />
    </header>
  );
};
