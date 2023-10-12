import { Link } from "@remix-run/react";
import { Drawer } from "vaul";

import type { Site } from "~/db/payload-types";
import {
   LoggedIn,
   LoggedOut,
   LoggedOutMobile,
} from "~/routes/_auth+/src/components";
import { siteHomeShouldReload } from "~/utils";

import { FollowingListMobile, PinnedList, PrimaryMenuLinks } from "./Menu";

export const MobileTray = ({
   children,
   onOpenChange,
   open,
}: {
   children: any;
   onOpenChange: any;
   open: boolean;
}) => {
   return (
      <Drawer.Root onOpenChange={onOpenChange} open={open}>
         <Drawer.Overlay className="fixed inset-0 z-40 min-h-[100vh] bg-black/40" />
         <Drawer.Portal>
            <Drawer.Content className="bg-2 fixed bottom-0 left-0 right-0 z-50 mx-auto mt-24 flex h-[80%] max-w-[728px] flex-col rounded-t-xl pb-5">
               <div className="bg-2 relative flex-1 rounded-t-xl p-4">
                  <div className="mx-auto mb-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  {children}
               </div>
            </Drawer.Content>
         </Drawer.Portal>
      </Drawer.Root>
   );
};

export const MenuTrayContent = ({
   site,
   onOpenChange,
}: {
   site: Site;
   onOpenChange: any;
}) => {
   return (
      <menu>
         <PrimaryMenuLinks site={site} onOpenChange={onOpenChange} />
         <PinnedList site={site} onOpenChange={onOpenChange} />
      </menu>
   );
};

export const FollowingTrayContent = ({
   site,
   isMobileApp,
   setFollowerMenuOpen,
}: {
   site: Site;
   isMobileApp: Boolean;
   setFollowerMenuOpen: any;
}) => {
   return (
      <>
         {isMobileApp && (
            <LoggedOut>
               <div className="flex w-full flex-col items-center justify-center px-4">
                  <Link
                     reloadDocument={siteHomeShouldReload({
                        site,
                     })}
                     className="block w-full rounded-full bg-zinc-800 px-4 py-3 text-center text-sm 
                     font-bold text-white dark:bg-zinc-200 dark:text-zinc-700"
                     to="/"
                  >
                     Explore
                  </Link>
                  <div className="flex w-full items-center gap-4 pb-6 pt-8">
                     <span className="h-0.5 flex-grow rounded-full bg-zinc-100 dark:bg-zinc-700/50" />
                     <span className="text-sm">or</span>
                     <span className="h-0.5 flex-grow rounded-full bg-zinc-100 dark:bg-zinc-700/50" />
                  </div>
                  <div className="pb-4 text-center text-sm font-semibold">
                     Login to view the sites you <b>follow</b>
                  </div>
                  <LoggedOutMobile />
               </div>
            </LoggedOut>
         )}
         <menu className="flex h-full flex-col">
            <FollowingListMobile
               site={site}
               isMobileApp={isMobileApp}
               setMenuOpen={setFollowerMenuOpen}
            />
            <LoggedIn>
               <Link
                  reloadDocument={siteHomeShouldReload({
                     site,
                  })}
                  className="mx-20 my-9 rounded-full bg-zinc-800 px-5 py-3
                   text-center text-sm font-bold text-white dark:bg-zinc-200 dark:text-zinc-700"
                  to="/"
               >
                  Explore
               </Link>
            </LoggedIn>
         </menu>
      </>
   );
};