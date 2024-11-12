import { SectionTitle } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/SectionTitle";

import type { EntryCardData } from "../$entryId";
import { deckColumns, deckGridView } from "../../_site.c.decks+/_index";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

export function CardsDecks({ data }: EntryCardData) {
   const { decks } = data;
   return (
      <>
         <SectionTitle customSlug="decks" customTitle="Decks" />
         <ListTable
            hideViewMode={true}
            gridView={deckGridView}
            defaultViewType="list"
            data={{
               listData: {
                  docs: decks,
               },
            }}
            columns={deckColumns}
            pager={false}
         />
      </>
   );
}
