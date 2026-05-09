import { parseInteger, parsePagination, parseId } from "../../utils/validation";

describe("Validation Utils", () => {
  describe("parseInteger", () => {
    it("should return the default value if input is undefined", () => {
      expect(parseInteger(undefined, 10)).toBe(10);
    });

    it("should return the default value if input is null", () => {
      expect(parseInteger(null, 10)).toBe(10);
    });

    it("should return the default value if input is an empty string", () => {
      expect(parseInteger("", 10)).toBe(10);
    });

    it("should return the default value if input is not a number", () => {
      expect(parseInteger("abc", 10)).toBe(10);
    });

    it("should parse a valid integer string", () => {
      expect(parseInteger("42", 10)).toBe(42);
    });

    it("should apply minimum constraint", () => {
      expect(parseInteger("5", 10, 10)).toBe(10);
    });

    it("should apply maximum constraint", () => {
      expect(parseInteger("15", 10, undefined, 10)).toBe(10);
    });
  });

  describe("parsePagination", () => {
    it("should parse valid pagination strings", () => {
      expect(parsePagination("2", "20")).toEqual({ page: 2, limit: 20 });
    });

    it("should apply default values for invalid input", () => {
      expect(parsePagination("abc", "def")).toEqual({ page: 1, limit: 50 });
    });

    it("should apply minimum page value of 1", () => {
      expect(parsePagination("0", "20")).toEqual({ page: 1, limit: 20 });
    });

    it("should apply maximum limit value of 100", () => {
      expect(parsePagination("1", "150")).toEqual({ page: 1, limit: 100 });
    });
  });

  describe("parseId", () => {
    it("should return null for invalid IDs", () => {
      expect(parseId("abc")).toBeNull();
      expect(parseId("-1")).toBeNull();
      expect(parseId("0")).toBeNull();
      expect(parseId("")).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it("should return the parsed ID for valid input", () => {
      expect(parseId("42")).toBe(42);
    });
  });
});
