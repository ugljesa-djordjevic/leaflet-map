import { app } from "@azure/functions";
import {
  DB_CONTAINERS,
  UNEXPECTED_ERROR_MESSAGE,
} from "../../utilities/constants";
import { IMapSite } from "../../model/LocationMap";
import { deduplicateSites } from "../../utilities/mapDedup";
import { getContainerByName } from "../../utilities/dbHelper";
import { handleError } from "../../utilities/handleError";

app.http("map-sites", {
  methods: ["GET"],
  route: "map/sites",
  handler: async (request) => {
    const countryCode = request.query.get("countryCode");
    const stateCode = request.query.get("stateCode");
    const cityName = request.query.get("cityName");

    const query = `
      SELECT c.id, c.organizationId, c.customerNbr, c.customerSiteNbr, c.storeNbr, c.storeName,
             c.cityName, c.stateName, c.stateCode, c.countryCode, c.siteId, c.percentAvailable, c.geoPosition
      FROM c
      WHERE IS_DEFINED(c.geoPosition) AND NOT IS_NULL(c.geoPosition)
        AND (IS_NULL(@countryCode) OR c.countryCode = @countryCode)
        AND (IS_NULL(@stateCode) OR c.stateCode = @stateCode)
        AND (IS_NULL(@cityName) OR c.cityName = @cityName)
    `;

    const parameters = [
      { name: "@countryCode", value: countryCode },
      { name: "@stateCode", value: stateCode },
      { name: "@cityName", value: cityName },
    ];

    try {
      const container = getContainerByName(DB_CONTAINERS.SITE_DEVICE_STATUS);
      const { resources } = await container.items
        .query<IMapSite>({ query, parameters })
        .fetchAll();

      return { status: 200, jsonBody: deduplicateSites(resources) };
    } catch (error) {
      console.log("Error fetching map sites", error);
      return handleError(500, UNEXPECTED_ERROR_MESSAGE);
    }
  },
});
