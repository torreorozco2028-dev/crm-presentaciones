export default function getNavbarBrand(pathname: string) {
  return pathname.replace('-', ' ').split('/').pop()?.trim() ?? '';
}
