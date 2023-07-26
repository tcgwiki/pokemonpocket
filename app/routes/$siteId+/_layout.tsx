import {
   Await,
   useFetcher,
   useLoaderData,
   useLocation,
   useRouteLoaderData,
} from "@remix-run/react";
import type {
   ActionFunction,
   LoaderArgs,
   V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { zx } from "zodix";
import { z } from "zod";
import { assertIsPost, isNativeSSR } from "~/utils";
import { Suspense, useEffect, useState } from "react";
import type { Site, Update, User } from "payload/generated-types";
import { DotLoader } from "~/components";
import * as gtag from "~/routes/$siteId+/utils/gtags.client";
import type { PaginatedDocs } from "payload/dist/mongoose/types";
import { deferIf } from "defer-if";
import { SafeArea } from "capacitor-plugin-safe-area";
import { useIsBot } from "~/utils/isBotProvider";
import { fetchWithCache } from "~/utils/cache.server";
import { settings } from "mana-config";

import {
   MobileNav,
   MobileTray,
   UserTrayContent,
   ColumnOne,
   Header,
   ColumnTwo,
   ColumnFour,
   ColumnThree,
   FollowingTrayContent,
} from "./components";

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderArgs) {
   const { siteId } = zx.parseParams(params, {
      siteId: z.string(),
   });

   const { isMobileApp } = isNativeSSR(request);

   const siteUrl = `${settings.domainFull}/api/sites?where[slug][equals]=${siteId}&depth=2`;

   const { docs: slug } = (await fetchWithCache(siteUrl, {
      headers: {
         cookie: request.headers.get("cookie") ?? "",
      },
   })) as PaginatedDocs<Site>;

   const site = slug[0];

   const updatesUrl = `${settings.domainFull}/api/updates?where[site.slug][equals]=${siteId}&depth=0&sort=-createdAt`;

   const { docs: updateResults } = (await fetchWithCache(updatesUrl, {
      headers: {
         cookie: request.headers.get("cookie") ?? "",
      },
   })) as PaginatedDocs<Update>;
   return await deferIf({ updateResults, site }, isMobileApp, {
      init: {
         headers: { "Cache-Control": "public, s-maxage=60, max-age=60" },
      },
   });
}

export const meta: V2_MetaFunction = ({ data }) => {
   return [
      {
         title: data.site.name,
      },
   ];
};

export const handle = {
   i18n: "site",
};

export default function SiteIndex() {
   const { site } = useLoaderData<typeof loader>() || {};
   const fetcher = useFetcher();
   const location = useLocation();
   const { user } = useRouteLoaderData("root") as { user: User };
   const [isFollowerMenuOpen, setFollowerMenuOpen] = useState(false);
   const [isUserMenuOpen, setUserMenuOpen] = useState(false);
   const [searchToggle, setSearchToggle] = useState(false);
   const gaTrackingId = site?.gaTagId;
   let isBot = useIsBot();

   const { isMobileApp, isIOS } = useRouteLoaderData("root") as {
      isMobileApp: Boolean;
      isIOS: Boolean;
   };
   //On native mobile, get the safe area padding
   const [safeArea, setSetArea] = useState() as any;

   useEffect(() => {
      if (process.env.NODE_ENV === "production" && gaTrackingId) {
         gtag.pageview(location.pathname, gaTrackingId);
      }
      setSearchToggle(false);
   }, [location, gaTrackingId]);

   useEffect(() => {
      if (isMobileApp) {
         SafeArea.getSafeAreaInsets().then(({ insets }) => {
            setSetArea(insets);
         });
      }
   }, [isMobileApp]);

   //Prevent layout shift on native. Don't paint screen yet.
   if (isMobileApp && !safeArea)
      return (
         <div className="bg-3 flex min-h-[100vh] min-w-full items-center justify-start">
            <DotLoader />
         </div>
      );

   return (
      <>
         <Header
            location={location}
            site={site}
            fetcher={fetcher}
            isMobileApp={isMobileApp}
            setFollowerMenuOpen={setFollowerMenuOpen}
         />
         <Suspense fallback="Loading...">
            <Await resolve={{ site }}>
               {({ site }) => (
                  <main>
                     <div
                        className="laptop:grid laptop:min-h-screen laptop:auto-cols-[82px_0px_1fr_334px] 
                     laptop:grid-flow-col desktop:auto-cols-[82px_220px_1fr_334px]"
                     >
                        {/* ==== Desktop Following Menu ==== */}
                        <ColumnOne site={site} user={user} />

                        {/* ==== Site Menu ==== */}
                        <ColumnTwo site={site} user={user} />

                        {/* ==== Main Content ==== */}
                        <ColumnThree
                           location={location}
                           searchToggle={searchToggle}
                           setSearchToggle={setSearchToggle}
                           safeArea={safeArea}
                           isMobileApp={isMobileApp}
                           site={site}
                           fetcher={fetcher}
                        />

                        {/* ==== Right Sidebar ==== */}
                        <ColumnFour
                           safeArea={safeArea}
                           site={site}
                           isMobileApp={isMobileApp}
                        />
                     </div>

                     {/* ============  Mobile Components ============ */}
                     <MobileNav
                        safeArea={safeArea}
                        setUserMenuOpen={setUserMenuOpen}
                        setFollowerMenuOpen={setFollowerMenuOpen}
                        isIOS={isIOS}
                        isMobileApp={isMobileApp}
                     />

                     {/* ==== Follows: Mobile ==== */}
                     <MobileTray
                        onOpenChange={setFollowerMenuOpen}
                        open={isFollowerMenuOpen}
                     >
                        <FollowingTrayContent
                           site={site}
                           isMobileApp={isMobileApp}
                           setFollowerMenuOpen={setFollowerMenuOpen}
                        />
                     </MobileTray>

                     {/* ==== User Menu: Mobile ==== */}
                     <MobileTray
                        onOpenChange={setUserMenuOpen}
                        open={isUserMenuOpen}
                     >
                        <UserTrayContent onOpenChange={setUserMenuOpen} />
                     </MobileTray>
                  </main>
               )}
            </Await>
         </Suspense>
         {/* ==== Google Analytics ==== */}
         {process.env.NODE_ENV === "production" && gaTrackingId && !isBot ? (
            <>
               <script
                  defer
                  src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
               />
               <script
                  defer
                  id="gtag-init"
                  dangerouslySetInnerHTML={{
                     __html: `
                              window.dataLayer = window.dataLayer || [];
                              function gtag(){dataLayer.push(arguments);}
                              gtag('js', new Date());

                              gtag('config', '${gaTrackingId}', {
                                 page_path: window.location.pathname,
                              });
                           `,
                  }}
               />
            </>
         ) : null}
      </>
   );
}

export const action: ActionFunction = async ({
   context: { payload, user },
   request,
   params,
}) => {
   assertIsPost(request);
   const { siteId } = zx.parseParams(params, {
      siteId: z.string(),
   });
   const { intent } = await zx.parseForm(request, {
      intent: z.string(),
   });

   // Follow Site
   if (intent === "followSite") {
      //We need to get the current sites of the user, then prepare the new sites array
      const userId = user?.id;
      const userCurrentSites = user?.sites || [];
      //@ts-ignore
      const sites = userCurrentSites.map(({ id }: { id }) => id);
      //Finally we update the user with the new site id

      const siteData = await payload.find({
         collection: "sites",
         where: {
            slug: {
               equals: siteId,
            },
         },
         user,
      });
      const siteUID = siteData?.docs[0].id;

      return await payload.update({
         collection: "users",
         id: userId ?? "",
         data: { sites: [...sites, siteUID] },
         overrideAccess: false,
         user,
      });
   }

   // Unfollow Site
   if (intent === "unfollow") {
      const userId = user?.id;

      const siteData = await payload.find({
         collection: "sites",
         where: {
            slug: {
               equals: siteId,
            },
         },
         user,
      });
      const siteUID = siteData?.docs[0].id;
      const site = await payload.findByID({
         collection: "sites",
         id: siteUID,
         user,
      });

      // Prevent site creator from leaving own site
      //@ts-ignore
      if (site.owner?.id === userId) {
         return json(
            {
               errors: "Cannot unfollow your own site",
            },
            { status: 400 }
         );
      }
      const userCurrentSites = user?.sites || [];
      //@ts-ignore
      const sites = userCurrentSites.map(({ id }: { id }) => id);

      //Remove the current site from the user's sites array
      const index = sites.indexOf(site.id);
      if (index > -1) {
         // only splice array when item is found
         sites.splice(index, 1); // 2nd parameter means remove one item only
      }
      return await payload.update({
         collection: "users",
         id: userId ?? "",
         data: { sites },
         overrideAccess: false,
         user,
      });
   }
};
