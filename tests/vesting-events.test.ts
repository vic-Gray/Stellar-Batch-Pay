import { parseVestingClaimedPayload } from "../lib/stellar/vesting-events";

describe("parseVestingClaimedPayload", () => {
  test("parses amount, token, and memo from event payload", () => {
    const parsed = parseVestingClaimedPayload(["100", "CDTOKENADDRESS", "Q1 payroll"]);
    expect(parsed).toEqual({
      amount: "100",
      token: "CDTOKENADDRESS",
      memo: "Q1 payroll",
    });
  });

  test("requires token address for claim payloads", () => {
    expect(() => parseVestingClaimedPayload(["100"])).toThrow(
      "Invalid VestingClaimed payload format."
    );
  });
});
