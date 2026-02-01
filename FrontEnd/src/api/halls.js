const API = "http://127.0.0.1:8000/api/moviehalls/";

export async function getHalls() {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data = await res.json();
    return data?.results ?? data;
}
