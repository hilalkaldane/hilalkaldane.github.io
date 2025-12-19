export const formatDate = (iso) => {
      console.log(iso)
  if (!iso) return "-";
  console.log(iso)
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
