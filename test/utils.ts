import { ethers } from "hardhat";

export async function getFirstEvent(filter, contract, eventName) {
  var event = await ethers.provider.getLogs(filter)
      .then((events) => {
          return events
              .map(event => {
                  try {
                      let e = contract.interface.parseLog(event);
                      return e;
                  } catch (e) {
                      return null;
                  }
              })
              .find(event => event ? event.name == eventName : false);
      });
  return event;
}