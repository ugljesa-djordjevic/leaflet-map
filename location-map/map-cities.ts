import { app } from "@azure/functions";
import {
  DB_CONTAINERS,
  UNEXPECTED_ERROR_MESSAGE,
} from "../../utilities/constants";
import { IMapCity } from "../../model/LocationMap";
import { deduplicateCities } from "../../utilities/mapDedup";
import { getContainerByName } from "../../utilities/dbHelper";
import { handleError } from "../../utilities/handleError";

app.http("map-cities", {
  methods: ["GET"],
  route: "map/cities",
  handler: async (request) => {
    const countryCode = request.query.get("countryCode");
    const stateCode = request.query.get("stateCode");

    const query = `
      SELECT c.id, c.organizationId, c.customerNbr, c.cityName, c.stateName, c.stateCode, c.countryCode, c.percentAvailable, c.geoPosition
      FROM c
      WHERE IS_DEFINED(c.geoPosition) AND NOT IS_NULL(c.geoPosition)
        AND (IS_NULL(@countryCode) OR c.countryCode = @countryCode)
        AND (IS_NULL(@stateCode) OR c.stateCode = @stateCode)
    `;

    const parameters = [
      { name: "@countryCode", value: countryCode },
      { name: "@stateCode", value: stateCode },
    ];

    try {
      const container = getContainerByName(DB_CONTAINERS.CITY_DEVICE_STATUS);
      const { resources } = await container.items
        .query<IMapCity>({ query, parameters })
        .fetchAll();

      return { status: 200, jsonBody: deduplicateCities(resources) };
    } catch (error) {
      console.log("Error fetching map cities", error);
      return handleError(500, UNEXPECTED_ERROR_MESSAGE);
    }
  },
});
