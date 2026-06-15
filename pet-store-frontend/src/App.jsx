import { useState, useEffect } from 'react';

export default function App() {
  const [pets, setPets] = useState([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [editingPet, setEditingPet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await fetch('http://localhost:3000/pets');
      const data = await response.json();
      setPets(data);
    } catch (err) {
      setError('Failed to load your pets');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/pets/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setPets(pets.filter(pet => pet.id !== id));
      } else {
        setError('Failed to delete pet');
      }
    } catch (err) {
      setError('Failed to delete pet');
    }
  };

  const openAddModal = () => {
    setEditingPet(null);
    setName('');
    setSpecies('');
    setAge('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (pet) => {
    setEditingPet(pet);
    setName(pet.name);
    setSpecies(pet.species);
    setAge(pet.age);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !species.trim() || age === '') {
      setError('Please fill in all details');
      return;
    }
    const petData = { name, species, age: parseInt(age) };
    try {
      if (editingPet) {
        const response = await fetch(`http://localhost:3000/pets/${editingPet.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(petData)
        });
        if (response.ok) {
          const updated = await response.json();
          setPets(pets.map(pet => pet.id === editingPet.id ? updated : pet));
          setIsModalOpen(false);
        } else {
          setError('Failed to update pet');
        }
      } else {
        const response = await fetch('http://localhost:3000/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(petData)
        });
        if (response.ok) {
          const created = await response.json();
          setPets([...pets, created]);
          setIsModalOpen(false);
        } else {
          setError('Failed to add pet');
        }
      }
    } catch (err) {
      setError('Server connection error');
    }
  };

  const getSpeciesBadge = (sp) => {
    const s = sp.toLowerCase();
    if (s.includes('dog')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('cat')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('rabbit')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('bird')) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm">
              🐾
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Pet Palace</h1>
              <p className="text-xs text-slate-400 font-medium">Dashboard</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5"
          >
            <span>+</span> Add Pet
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold hover:text-rose-900">×</button>
          </div>
        )}

        {pets.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <span className="text-5xl">🐱</span>
            <h2 className="text-xl font-bold text-slate-800 mt-4">Your Palace is empty!</h2>
            <p className="text-slate-400 text-sm mt-2">Bring some cute pets to your dashboard by adding them now.</p>
            <button
              onClick={openAddModal}
              className="mt-6 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-sm px-5 py-2.5 rounded-2xl transition-all"
            >
              Add a Pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {pet.name}
                    </h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getSpeciesBadge(pet.species)}`}>
                      {pet.species}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-3 font-medium">
                    Age: <span className="text-slate-800 font-bold">{pet.age}</span> {pet.age === 1 ? 'year' : 'years'} old
                  </p>
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => openEditModal(pet)}
                    className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-semibold text-xs py-2 rounded-xl transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    className="flex-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs py-2 rounded-xl transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {editingPet ? 'Update Pet Details' : 'Add New Pet'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Pet Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Fluffy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Species
                </label>
                <input
                  type="text"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Dog, Cat, Rabbit"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. 3"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-sm py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  {editingPet ? 'Save Changes' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
