const API = `${import.meta.env.VITE_API_URL || ""}/api/moviehalls/`;

export async function getHalls() {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data = await res.json();
    return data?.results ?? data;
}
