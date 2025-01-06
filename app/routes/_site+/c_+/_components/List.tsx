import { useState, type ReactNode } from "react";

import { useLoaderData, useLocation, useParams } from "@remix-run/react";
import type {
   VisibilityState,
   AccessorKeyColumnDef,
   AccessorKeyColumnDefBase,
   SortingState,
   ColumnFiltersState,
} from "@tanstack/react-table";

import type { Collection } from "~/db/payload-types";
import { useSiteLoaderData } from "~/utils/useSiteLoaderData";

import { AddEntry } from "./AddEntry";
import { CollectionHeader } from "./CollectionHeader";
import { ListTable } from "./ListTable";
import { AdUnit } from "../../_components/RampUnit";

export type Section = {
   id: string;
   slug: string;
   name?: string;
   showTitle?: boolean;
   showAd?: boolean;
   viewType?: "tabs" | "rows";
   subSections?: [
      {
         id: string;
         showTitle?: boolean;
         slug: string;
         name: string;
         type: string;
      },
   ];
};

export type TableFilters = {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label: string; value: string; icon?: string }[];
}[];

export function List({
   children,
   columns,
   columnViewability,
   filters,
   defaultViewType,
   gridView,
   defaultSort,
   beforeListComponent,
   defaultFilters,
}: {
   children?: ReactNode;
   columns: AccessorKeyColumnDefBase<any>[];
   filters?: TableFilters;
   defaultViewType?: "list" | "grid";
   gridView?: AccessorKeyColumnDef<any>;
   columnViewability?: VisibilityState;
   defaultSort?: SortingState;
   beforeListComponent?: ReactNode;
   defaultFilters?: ColumnFiltersState;
}) {
   // defaultFilters allows setting filters at a starting state; format:
   // defaultFilters = [{ id: "alignment", value: ["evil"] }];
   // id is equal to ID for a column, value is an array containing all values that should be filtered

   //@ts-ignore
   const { list } = useLoaderData();
   const { site } = useSiteLoaderData();

   //Get path for custom site, cant use useParams since it doesn't exist when using a custom template
   const { pathname } = useLocation();
   const collectionSlug = pathname.split("/")[2];
   const collectionId = useParams()?.collectionId ?? collectionSlug;
   const collection = site?.collections?.find(
      (collection) => collection.slug === collectionId,
   ) as Collection;

   const [allSections, setAllSections] = useState(
      collection?.sections as Section[],
   );
   const [isChanged, setIsChanged] = useState(false);

   return (
      <>
         <CollectionHeader
            collection={collection}
            allSections={allSections}
            setAllSections={setAllSections}
            setIsChanged={setIsChanged}
            isChanged={isChanged}
         />
         <AdUnit
            enableAds={site.enableAds}
            adType={{
               desktop: "leaderboard_atf",
               tablet: "leaderboard_atf",
               mobile: "med_rect_atf",
            }}
            className="mt-6 mb-4 mx-auto flex items-center justify-center"
            selectorId="listDesktopLeaderATF"
         />
         {beforeListComponent}
         <div className="mx-auto max-w-[728px] max-tablet:px-3 py-4 laptop:pb-14">
            {!collection?.customDatabase && <AddEntry />}
            {children ? (
               children
            ) : (
               <ListTable
                  defaultSort={defaultSort}
                  defaultViewType={defaultViewType}
                  key={collectionId}
                  data={list}
                  columns={columns}
                  collection={collection}
                  filters={filters}
                  columnViewability={columnViewability}
                  gridView={gridView}
                  defaultFilters={defaultFilters}
               />
            )}
         </div>
      </>
   );
}
