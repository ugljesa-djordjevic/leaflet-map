import { app } from "@azure/functions";
import {
  DB_CONTAINERS,
  UNEXPECTED_ERROR_MESSAGE,
} from "../../utilities/constants";
import { IMapCountry } from "../../model/LocationMap";
import { deduplicateCountries } from "../../utilities/mapDedup";
import { getContainerByName } from "../../utilities/dbHelper";
import { handleError } from "../../utilities/handleError";

app.http("map-countries", {
  methods: ["GET"],
  route: "map/countries",
  handler: async () => {
    const query = `
      SELECT c.id, c.organizationId, c.customerNbr, c.countryCode, c.percentAvailable, c.geoPosition
      FROM c
      WHERE IS_DEFINED(c.geoPosition) AND NOT IS_NULL(c.geoPosition)
    `;

    try {
      const container = getContainerByName(DB_CONTAINERS.COUNTRY_DEVICE_STATUS);
      const { resources } = await container.items
        .query<IMapCountry>({ query })
        .fetchAll();

      return { status: 200, jsonBody: deduplicateCountries(resources) };
    } catch (error) {
      console.log("Error fetching map countries", error);
      return handleError(500, UNEXPECTED_ERROR_MESSAGE);
    }
  },
});
