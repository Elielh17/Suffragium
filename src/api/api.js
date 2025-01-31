const API_URL = "http://localhost:5000";

export const fetchData = async () => {
    try {
        const response = await fetch(`${API_URL}/`);
        const data = await response.text();
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return "Error fetching data";
    }
};
