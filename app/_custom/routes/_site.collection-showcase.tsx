import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import { CustomPageHeader } from "~/components/CustomPageHeader";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

import { gqlFetch } from "~/utils/fetchers.server";

import { createColumnHelper } from "@tanstack/react-table";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";

import type { UserSetting } from "payload/generated-custom-types";
import { Avatar } from "~/components/Avatar";
import { Text, TextLink } from "~/components/Text";

export async function loader({
   request,
   context: { payload },
}: LoaderFunctionArgs) {
   const collectionShowcase = await gqlFetch({
      isAuthOverride: true,
      isCustomDB: true,
      isCached: false,
      query: QUERY,
      request,
   });
   const userIds = collectionShowcase.showcases.docs.map((user) => user.id);

   // Fetch avatars for each user
   const usersWithAvatars = await Promise.all(
      userIds.map(async (userId) => {
         const user = await payload.findByID({
            collection: "users",
            id: userId,
         });
         return user.avatar?.url || null;
      }),
   );

   // Attach avatars to the showcase data
   collectionShowcase.showcases.docs = collectionShowcase.showcases.docs.map(
      (user, index) => ({
         ...user,
         avatarUrl: usersWithAvatars[index],
      }),
   );

   return json(collectionShowcase);
}

export const meta: MetaFunction = () => {
   return [
      {
         title: "Collection Showcase | Pokémon TCG Pocket - TCG Wiki",
      },
   ];
};

export default function TierList() {
   const data = useLoaderData<typeof loader>();
   return (
      <>
         <CustomPageHeader
            name="Collection Showcase"
            iconUrl="https://static.mana.wiki/character-showcase-icon.png"
         />
         <div className="relative z-20 mx-auto max-w-[728px] justify-center max-tablet:px-3 pb-3 tablet:pb-36">
            <div className="text-sm bg-2-sub text-1 shadow-sm rounded-lg p-3 mt-4 border border-color-sub shadow-1 mb-1">
               <div className="pb-1.5">
                  Connect with fellow players, share your{" "}
                  <span className="text-light dark:text-dark font-bold">
                     collection
                  </span>{" "}
                  and/or{" "}
                  <span className="text-light dark:text-dark font-bold">
                     friend id
                  </span>{" "}
                  with the community!
               </div>
               <Text className="!text-xs">
                  - Toggle your collection to public{" "}
                  <TextLink href="/collection-tracker">here</TextLink>.
               </Text>
            </div>
            <ListTable
               defaultViewType="list"
               data={{ listData: { docs: data.showcases.docs } }}
               columns={columns}
               hideViewMode
            />
         </div>
      </>
   );
}

const columnHelper = createColumnHelper<UserSetting>();

const columns = [
   columnHelper.accessor("username", {
      header: "Username",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               to={`/collection-tracker?u=${info.getValue()}`}
               className="flex items-center gap-3 group py-0.5 group"
            >
               <div className="flex items-center gap-2 group">
                  <Avatar
                     src={info.row.original.avatarUrl}
                     initials={
                        info.row.original.avatarUrl
                           ? undefined
                           : info.row.original.username.charAt(0)
                     }
                     className="size-6 mx-auto"
                     options="aspect_ratio=1:1&height=120&width=120"
                  />
                  <span className="text-sm group-hover:underline">
                     {info.getValue()}
                  </span>
               </div>
            </Link>
         );
      },
   }),
];

const QUERY = gql`
   query {
      showcases: UserSettings(
         where: { isCollectionPublic: { equals: true } }
         limit: 5000
      ) {
         docs {
            id
            friendId
            username
            updatedAt
         }
      }
   }
`;
