import { app } from "@azure/functions";
import {
  DB_CONTAINERS,
  UNEXPECTED_ERROR_MESSAGE,
} from "../../utilities/constants";
import { IMapState } from "../../model/LocationMap";
import { deduplicateStates } from "../../utilities/mapDedup";
import { getContainerByName } from "../../utilities/dbHelper";
import { handleError } from "../../utilities/handleError";

app.http("map-states", {
  methods: ["GET"],
  route: "map/states",
  handler: async (request) => {
    const countryCode = request.query.get("countryCode");

    const query = `
      SELECT c.id, c.organizationId, c.customerNbr, c.stateName, c.stateCode, c.countryCode, c.percentAvailable, c.geoPosition
      FROM c
      WHERE IS_DEFINED(c.geoPosition) AND NOT IS_NULL(c.geoPosition)
        AND (IS_NULL(@countryCode) OR c.countryCode = @countryCode)
    `;

    const parameters = [{ name: "@countryCode", value: countryCode }];

    try {
      const container = getContainerByName(DB_CONTAINERS.STATE_DEVICE_STATUS);
      const { resources } = await container.items
        .query<IMapState>({ query, parameters })
        .fetchAll();

      return { status: 200, jsonBody: deduplicateStates(resources) };
    } catch (error) {
      console.log("Error fetching map states", error);
      return handleError(500, UNEXPECTED_ERROR_MESSAGE);
    }
  },
});
