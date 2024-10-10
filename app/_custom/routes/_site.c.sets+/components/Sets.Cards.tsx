import { Set } from "~/db/payload-custom-types";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";
import {
   cardFilters,
   cardGridView,
   cardColumns,
} from "../../_site.c.cards+/_index";

export function SetsCards({ data }: { data: Set }) {
   return (
      <ListTable
         gridView={cardGridView}
         columnViewability={{
            pokemonType: false,
            isEX: false,
            cardType: false,
         }}
         defaultViewType="grid"
         defaultSort={[{ id: "rarity", desc: true }]}
         data={{ listData: { docs: data?.cards } }}
         columns={cardColumns}
         filters={cardFilters}
      />
   );
}
