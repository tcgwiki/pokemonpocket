import { descriptionParser } from "~/_custom/utils/descriptionParser";
import { Ability } from "~/db/payload-custom-types";

export function AbilitiesMain({ data }: { data: Ability }) {
   const ability = data;

   return (
      <div
         className="border border-color-sub bg-2-sub p-4 rounded-xl shadow-sm shadow-1"
         dangerouslySetInnerHTML={{
            __html: descriptionParser(ability.desc ?? ""),
         }}
      />
   );
}
