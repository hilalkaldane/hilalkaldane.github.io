export function buildOfferHeadline({ offerType, discount }) {
  if (!offerType || discount == null) return "LIMITED TIME DEAL";

  switch (offerType) {
    case "FLAT":
      return `₹${discount} OFF`;
    case "FIXED":
      return `₹${discount} OFF`;
    case "PERCENTAGE":
      return `${discount}% OFF`;
    default:
      return "LIMITED TIME DEAL";
  }
}

export function buildCtaCopy({ offerType, discount }) {
  if (!offerType || discount == null) return "Save now";

  switch (offerType) {
    case "FLAT":
    case "FIXED":
      return `Save ₹${discount} now`;
    case "PERCENTAGE":
      return `Save ${discount}% now`;
    default:
      return "Save now";
  }
}
